
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import {
  CancellationResponse,
  CreateCancellationRequest,
  EnrollmentResponse,
} from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

@Component({
  selector: 'app-my-enrollments',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './my-enrollments.css',
  templateUrl: './my-enrollments.html',
})
export class MyEnrollments implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);

  enrollments = signal<EnrollmentResponse[]>([]);
  cancellationRequests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  isSubmittingCancellation = signal(false);

  errorMessage = signal('');
  cancellationError = signal('');
  successMessage = signal('');

  selectedEnrollmentId = signal<number | null>(null);
  cancellationReason = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadCancellationRequests();
  }

  // Load the logged-in student's enrollments
  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getMyEnrollments(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.getErrorMessage(
            error,
            'Unable to load your enrollments.',
          ));
          this.isLoading.set(false);
        },
      });
  }

  // Load cancellation requests submitted by this student
  loadCancellationRequests(): void {
    this.enrollmentService.getMyCancellationRequests().subscribe({
      next: (response) => {
        this.cancellationRequests.set(response.items);
      },
      error: (error: HttpErrorResponse) => {
        this.cancellationError.set(this.getErrorMessage(
          error,
          'Unable to load cancellation request details.',
        ));
      },
    });
  }

  // Find the latest cancellation request for an enrollment
  getLatestCancellationRequest(
    enrollmentId: number,
  ): CancellationResponse | undefined {
    return this.cancellationRequests()
      .filter((request) => request.enrollmentId === enrollmentId)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() -
          new Date(a.requestedAt).getTime(),
      )[0];
  }

  // Display the enrollment status
  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  // Display the cancellation request status
  cancellationStatusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  // Open the cancellation reason form
  openCancellationForm(enrollmentId: number): void {
    this.selectedEnrollmentId.set(enrollmentId);
    this.cancellationReason.set('');
    this.cancellationError.set('');
    this.successMessage.set('');
  }

  // Close the cancellation reason form
  closeCancellationForm(): void {
    this.selectedEnrollmentId.set(null);
    this.cancellationReason.set('');
    this.cancellationError.set('');
  }

  // Submit the cancellation request
  submitCancellationRequest(enrollmentId: number): void {
    const reason = this.cancellationReason().trim();

    if (!reason) {
      this.cancellationError.set('Please enter a reason for cancellation.');
      return;
    }

    if (reason.length > 1000) {
      this.cancellationError.set(
        'The reason cannot be longer than 1000 characters.',
      );
      return;
    }

    const request: CreateCancellationRequest = { reason };

    this.isSubmittingCancellation.set(true);
    this.cancellationError.set('');
    this.successMessage.set('');

    this.enrollmentService
      .createCancellationRequest(enrollmentId, request)
      .subscribe({
        next: (response) => {
          this.cancellationRequests.update((requests) => [
            response,
            ...requests,
          ]);

          this.isSubmittingCancellation.set(false);
          this.selectedEnrollmentId.set(null);
          this.cancellationReason.set('');
          this.successMessage.set(
            'Your cancellation request has been submitted successfully.',
          );
        },
        error: (error: HttpErrorResponse) => {
          this.cancellationError.set(this.getErrorMessage(
            error,
            'Unable to submit your cancellation request.',
          ));
          this.isSubmittingCancellation.set(false);
        },
      });
  }

  // Extract a useful error message from the API response
  private getErrorMessage(
    error: HttpErrorResponse,
    fallback: string,
  ): string {
    const body = error.error;

    return (
      body?.detail ||
      body?.message ||
      body?.title ||
      fallback
    );
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadEnrollments();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadEnrollments();
    }
  }
}
