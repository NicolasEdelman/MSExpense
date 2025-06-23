import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const topCategoriesTrend = new Trend('top_categories_duration');
const expensesByCategoryTrend = new Trend('expenses_by_category_duration');

// Test configuration
export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 20, // 20 RPS = 1200 req/min
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    'errors': ['rate<0.01'], // Less than 1% errors
    'top_categories_duration': ['p(95)<300'], // p95 < 300ms
    'expenses_by_category_duration': ['p(95)<300'], // p95 < 300ms
  },
};

// Test data
const API_KEY = '0309f436-e69c-472b-843e-149a069afaf6:83277465-b9eb-4688-be01-f7bb19563084';
const BASE_URL = 'http://localhost:3000/api';
const CATEGORY_ID = '8c39866b-a80e-4eed-88e5-a8ae854f48c0';
const COMPANY_ID = 'b38122d1-5f99-4c91-a349-97e1d6ca8e9d';
const USER_ID = '172ca67f-3591-4ab4-9250-21f43ca4cc54';

// Helper function to get date range
function getDateRange() {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // Set to yesterday
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 14); // Set to two weeks ago
  
  // Format dates as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString();
  };
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

export default function () {
  const headers = {
    'x-api-key': API_KEY,
    'x-company-id': COMPANY_ID,
    'x-user-id': USER_ID,
    'x-user-role': 'SUPERADMIN',
    'Content-Type': 'application/json',
  };

  // Test top categories endpoint
  const topCategoriesResponse = http.get(
    `${BASE_URL}/expenses/top-categories`,
    { headers }
  );

  if (topCategoriesResponse.status !== 200) {
    console.error('Top categories request failed:', topCategoriesResponse.status, topCategoriesResponse.body);
  }
  
  check(topCategoriesResponse, {
    'top categories status is 200': (r) => r.status === 200,
    'top categories has success field': (r) => r.json('success') === true,
    'top categories has data field': (r) => r.json('data') !== undefined,
  });
  
  topCategoriesTrend.add(topCategoriesResponse.timings.duration);
  errorRate.add(topCategoriesResponse.status !== 200);

  // Test expenses by category endpoint
  const dateRange = getDateRange();
  const url = `${BASE_URL}/expenses/${CATEGORY_ID}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
    
  const expensesByCategoryResponse = http.get(url, { headers });

  if (expensesByCategoryResponse.status !== 200) {
    console.error('Expenses by category request failed:', expensesByCategoryResponse.status, expensesByCategoryResponse.body);
  }
  
  check(expensesByCategoryResponse, {
    'expenses by category status is 200': (r) => r.status === 200,
    'expenses by category has success field': (r) => r.json('success') === true,
    'expenses by category has data field': (r) => r.json('data') !== undefined,
  });
  
  expensesByCategoryTrend.add(expensesByCategoryResponse.timings.duration);
  errorRate.add(expensesByCategoryResponse.status !== 200);

  // Sleep between iterations to maintain the target rate
  sleep(1);
} 