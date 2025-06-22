interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  companyId?: string;
}

class UserService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://auth-asp-env.eba-6isvpepp.us-east-1.elasticbeanstalk.com/api/auth/users';
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
    console.log('Fetching user by ID:', userId);
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const body = await response.json();
      console.log('Response:',  body);


      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      
      return body;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}

export const userService = new UserService();
