
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../../shared/models/paged-result.model';
import {
  CancellationPagedResult,
  CancellationQuery,
  CancellationResponse,
  CreateCancellationRequest,
  CreateEnrollmentRequest,
  EnrollmentFilter,
  EnrollmentResponse,
  ReviewCancellationRequest,
} from './enrollment.models';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/enrollments`;
  private readonly cancellationApiUrl =
    `${environment.apiUrl}/cancellation-requests`;

  // Get all enrollments (Admin)
  getEnrollments(
    pageNumber = 1,
    pageSize = 10,
    filters?: EnrollmentFilter,
  ): Observable<PagedResult<EnrollmentResponse>> {
    return this.http.get<PagedResult<EnrollmentResponse>>(this.apiUrl, {
      params: this.buildEnrollmentParams(pageNumber, pageSize, filters),
    });
  }

  // Get logged-in student's enrollments
  getMyEnrollments(
    pageNumber = 1,
    pageSize = 10,
    filters?: EnrollmentFilter,
  ): Observable<PagedResult<EnrollmentResponse>> {
    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/my`,
      {
        params: this.buildEnrollmentParams(pageNumber, pageSize, filters),
      },
    );
  }

  // Get enrollments by student
  getEnrollmentsByStudent(
    studentId: number,
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<EnrollmentResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/student/${studentId}`,
      { params },
    );
  }

  // Get enrollments by course
  getEnrollmentsByCourse(
    courseId: number,
    pageNumber = 1,
    pageSize = 10,
  ): Observable<PagedResult<EnrollmentResponse>> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<EnrollmentResponse>>(
      `${this.apiUrl}/course/${courseId}`,
      { params },
    );
  }

  // Create an enrollment
  createEnrollment(
    request: CreateEnrollmentRequest,
  ): Observable<EnrollmentResponse> {
    return this.http.post<EnrollmentResponse>(this.apiUrl, request);
  }

  // Get cancellation requests submitted by the logged-in student
  getMyCancellationRequests(
    pageNumber = 1,
    pageSize = 100,
  ): Observable<CancellationPagedResult> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    return this.http.get<CancellationPagedResult>(
      `${this.cancellationApiUrl}/my`,
      { params },
    );
  }

  // Create a cancellation request (Student)
  createCancellationRequest(
    enrollmentId: number,
    request: CreateCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(
      `${this.apiUrl}/${enrollmentId}/cancellation-request`,
      request,
    );
  }

  // Get all cancellation requests (Admin)
  getCancellationRequests(
    pageNumber = 1,
    pageSize = 10,
    filters?: CancellationQuery,
  ): Observable<CancellationPagedResult> {
    return this.http.get<CancellationPagedResult>(
      this.cancellationApiUrl,
      {
        params: this.buildCancellationParams(
          pageNumber,
          pageSize,
          filters,
        ),
      },
    );
  }

  // Approve a cancellation request (Admin)
  approveCancellationRequest(
    requestId: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(
      `${this.cancellationApiUrl}/${requestId}/approve`,
      request,
    );
  }

  // Reject a cancellation request (Admin)
  rejectCancellationRequest(
    requestId: number,
    request: ReviewCancellationRequest,
  ): Observable<CancellationResponse> {
    return this.http.put<CancellationResponse>(
      `${this.cancellationApiUrl}/${requestId}/reject`,
      request,
    );
  }

  // Build enrollment query parameters
  private buildEnrollmentParams(
    pageNumber: number,
    pageSize: number,
    filters?: EnrollmentFilter,
  ): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }

    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    if (filters?.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }

    if (filters?.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return params;
  }

  // Build cancellation request query parameters
  private buildCancellationParams(
    pageNumber: number,
    pageSize: number,
    filters?: CancellationQuery,
  ): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.courseId != null) {
      params = params.set('courseId', filters.courseId);
    }

    if (filters?.status != null) {
      params = params.set('status', filters.status);
    }

    if (filters?.fromDate) {
      params = params.set('fromDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params = params.set('toDate', filters.toDate);
    }

    if (filters?.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return params;
  }
}
