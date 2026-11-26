
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import {
  CancellationQuery,
  CancellationResponse,
  ReviewCancellationRequest,
} from '../../enrollment.models';
import { EnrollmentService } from '../../enrollment.service';

type ReviewAction = 'approve' | 'reject';

@Component({
  selector: 'app-cancellation-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cancellation-requests.html',
  styleUrl: './cancellation-requests.css',
})
export class CancellationRequestsComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly fb = inject(FormBuilder);

  requests = signal<CancellationResponse[]>([]);

  isLoading = signal(false);
  isReviewing = signal(false);

  errorMessage = signal('');
  reviewError = signal('');
  successMessage = signal('');

  selectedRequestId = signal<number | null>(null);
  reviewAction = signal<ReviewAction | null>(null);
  adminRemarks = signal('');

  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  filterForm = this.fb.nonNullable.group({
    search: [''],
    courseId: [''],
    status: ['all'],
    fromDate: [''],
    toDate: [''],
    sortOrder: ['desc'],
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  private buildFilters(): CancellationQuery {
    const values = this.filterForm.getRawValue();

    return {
      search: values.search.trim() || undefined,
      courseId: values.courseId ? Number(values.courseId) : null,
      status: values.status === 'all' ? null : Number(values.status),
      fromDate: values.fromDate || undefined,
      toDate: values.toDate || undefined,
      sortOrder: values.sortOrder,
    };
  }

  // Load cancellation requests from the API
  loadRequests(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.enrollmentService
      .getCancellationRequests(
        this.pageNumber(),
        this.pageSize(),
        this.buildFilters(),
      )
      .subscribe({
        next: (response) => {
          this.requests.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.error?.detail ||
            error.error?.message ||
            error.error?.title ||
            'Unable to load cancellation requests.',
          );
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadRequests();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      courseId: '',
      status: 'all',
      fromDate: '',
      toDate: '',
      sortOrder: 'desc',
    });

    this.pageNumber.set(1);
    this.loadRequests();
  }

  statusLabel(status: number): string {
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

  // Open the review form for a Pending request
  openReview(requestId: number, action: ReviewAction): void {
    this.selectedRequestId.set(requestId);
    this.reviewAction.set(action);
    this.adminRemarks.set('');
    this.reviewError.set('');
    this.successMessage.set('');
  }

  closeReview(): void {
    this.selectedRequestId.set(null);
    this.reviewAction.set(null);
    this.adminRemarks.set('');
    this.reviewError.set('');
  }

  // Approve or reject a cancellation request
  submitReview(requestId: number): void {
    const action = this.reviewAction();

    if (!action || this.isReviewing()) {
      return;
    }

    const remarks = this.adminRemarks().trim();

    if (remarks.length > 1000) {
      this.reviewError.set('Admin remarks cannot exceed 1000 characters.');
      return;
    }

    const request: ReviewCancellationRequest = {
      adminRemarks: remarks,
    };

    this.isReviewing.set(true);
    this.reviewError.set('');
    this.successMessage.set('');

    const review$ =
      action === 'approve'
        ? this.enrollmentService.approveCancellationRequest(
            requestId,
            request,
          )
        : this.enrollmentService.rejectCancellationRequest(
            requestId,
            request,
          );

    review$.subscribe({
      next: (updatedRequest) => {
        this.requests.update((currentRequests) =>
          currentRequests.map((item) =>
            item.cancellationRequestId === requestId
              ? updatedRequest
              : item,
          ),
        );

        this.isReviewing.set(false);
        this.closeReview();

        this.successMessage.set(
          action === 'approve'
            ? 'Cancellation request approved successfully.'
            : 'Cancellation request rejected successfully.',
        );
      },
      error: (error: HttpErrorResponse) => {
        this.reviewError.set(
          error.error?.detail ||
          error.error?.message ||
          error.error?.title ||
          'Unable to review this cancellation request.',
        );
        this.isReviewing.set(false);
      },
    });
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadRequests();
    }
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadRequests();
    }
  }
}
