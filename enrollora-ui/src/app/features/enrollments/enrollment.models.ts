
import { PagedResult } from '../../shared/models/paged-result.model';

export interface EnrollmentResponse {
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseName: string;
  enrolledAt: string;
  status: number;
}

export interface CreateEnrollmentRequest {
  courseId: number;
}

export interface EnrollmentFilter {
  search?: string;
  courseId?: number | null;
  status?: number | null;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export type EnrollmentPagedResult = PagedResult<EnrollmentResponse>;

// Create a cancellation request (Student)
export interface CreateCancellationRequest {
  reason: string;
}

// Cancellation request returned by the API
export interface CancellationResponse {
  cancellationRequestId: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  courseName: string;
  reason: string;
  status: number;
  requestedAt: string;
  reviewedAt: string | null;
  adminRemarks: string | null;
}

// Filters for cancellation requests (Admin and Student)
export interface CancellationQuery {
  search?: string;
  courseId?: number | null;
  status?: number | null;
  fromDate?: string;
  toDate?: string;
  sortOrder?: string;
}

// Admin remarks when approving or rejecting
export interface ReviewCancellationRequest {
  adminRemarks: string;
}

export type CancellationPagedResult = PagedResult<CancellationResponse>;
