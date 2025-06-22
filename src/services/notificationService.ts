import { ExpenseNotificationData, SendEmailOptions } from "../interfaces/email";
import { userService } from "./userService";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

class NotificationService {
  private sqsQueueUrl: string;
  private sqsClient: SQSClient;

  constructor() {
    this.sqsQueueUrl = process.env.SQS_QUEUE_URL || "";
    this.sqsClient = new SQSClient({
      region: process.env.SQS_AWS_REGION || "",
      credentials: {
        accessKeyId: process.env.SQS_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.SQS_AWS_SECRET_ACCESS_KEY || "",
        sessionToken: process.env.SQS_AWS_SESSION_TOKEN || "",
      },
    });

    if (!this.sqsQueueUrl) {
      console.warn(
        "SQS_QUEUE_URL not configured, notifications will be logged only"
      );
    }
  }

  async sendExpenseNotification(
    notificationData: ExpenseNotificationData
  ): Promise<void> {
    try {
      const emailMessage = this.generateEmailMessage(notificationData);

      if (this.sqsQueueUrl) {
        await this.sendToSQS(emailMessage);
      } else {
        console.log(
          "Notification logged (SQS not configured):",
          JSON.stringify(emailMessage, null, 2)
        );
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  async sendExpenseNotificationWithUserEmail(
    action: "CREATE" | "UPDATE" | "DELETE",
    expense: any,
    changes?: { field: string; oldValue: any; newValue: any }[]
  ): Promise<void> {
    try {
      const user = await userService.getUserById(expense.userId);
      if (!user?.email) {
        console.warn(
          `No email found for user ${expense.userId}, skipping notification`
        );
        return;
      }

      const notificationData = this.generateExpenseNotificationData(
        action,
        expense,
        user.email,
        changes
      );

      await this.sendExpenseNotification(notificationData);
    } catch (error) {
      console.error("Error sending expense notification:", error);
    }
  }

  async sendToSQS(emailMessage: SendEmailOptions): Promise<void> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.sqsQueueUrl,
        MessageBody: JSON.stringify(emailMessage),
        MessageAttributes: {
          MessageType: {
            DataType: "String",
            StringValue: "EXPENSE_NOTIFICATION",
          },
        },
      });

      const result = await this.sqsClient.send(command);
      console.log("Message sent to SQS successfully:", result.MessageId);
    } catch (error) {
      console.error("Error sending message to SQS:", error);
      throw error;
    }
  }

  generateEmailMessage(
    notificationData: ExpenseNotificationData
  ): SendEmailOptions {
    const { action, expenseData, changes, actionDate } = notificationData;

    const actionText = {
      CREATE: "creado",
      UPDATE: "modificado",
      DELETE: "eliminado",
    }[action];

    const subject = `Gasto ${actionText} - ${
      expenseData.categoryName || "Sin categoría"
    }`;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    };

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Notificación de Gasto</h2>
        <p><strong>Acción:</strong> ${actionText.toUpperCase()}</p>
        <p><strong>Fecha de la acción:</strong> ${formatDate(actionDate)}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalles del Gasto</h3>
          <p><strong>ID:</strong> ${expenseData.id}</p>
          <p><strong>Monto:</strong> ${formatCurrency(expenseData.amount)}</p>
          <p><strong>Fecha del gasto:</strong> ${formatDate(
            expenseData.dateProduced
          )}</p>
          <p><strong>Categoría:</strong> ${
            expenseData.categoryName || "Sin categoría"
          }</p>
          <p><strong>Usuario:</strong> ${expenseData.userId}</p>
          <p><strong>Empresa:</strong> ${expenseData.companyId}</p>
        </div>
    `;

    if (changes && changes.length > 0) {
      html += `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #856404;">Cambios Realizados</h3>
          <ul style="margin: 0; padding-left: 20px;">
      `;

      changes.forEach((change) => {
        const oldValue =
          typeof change.oldValue === "object"
            ? formatDate(change.oldValue)
            : change.oldValue;
        const newValue =
          typeof change.newValue === "object"
            ? formatDate(change.newValue)
            : change.newValue;

        html += `
          <li><strong>${change.field}:</strong> ${oldValue} → ${newValue}</li>
        `;
      });

      html += `
          </ul>
        </div>
      `;
    }

    html += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
          <p>Este es un mensaje automático del sistema de gestión de gastos.</p>
          <p>Fecha de envío: ${formatDate(new Date())}</p>
        </div>
      </div>
    `;

    return {
      to: notificationData.userEmail,
      subject,
      html,
    };
  }

  generateExpenseNotificationData(
    action: "CREATE" | "UPDATE" | "DELETE",
    expense: any,
    userEmail: string,
    changes?: { field: string; oldValue: any; newValue: any }[]
  ): ExpenseNotificationData {
    return {
      expenseId: expense.id,
      action,
      actionDate: new Date(),
      expenseData: {
        id: expense.id,
        amount: expense.amount,
        dateProduced: expense.dateProduced,
        categoryId: expense.categoryId,
        categoryName: expense.category?.name,
        userId: expense.userId,
        companyId: expense.companyId,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      },
      changes,
      userEmail,
    };
  }
}

export const notificationService = new NotificationService();
