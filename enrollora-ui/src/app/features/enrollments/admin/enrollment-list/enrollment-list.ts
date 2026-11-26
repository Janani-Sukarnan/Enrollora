
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { EnrollmentService } from '../../enrollment.service';
import { EnrollmentFilter, EnrollmentResponse } from '../../enrollment.models';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './enrollment-list.html',
  styleUrl: './enrollment-list.css',
})
export class EnrollmentListComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private fb = inject(FormBuilder);

  enrollments = signal<EnrollmentResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

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
    sortBy: ['date'],
    sortOrder: ['desc'],
  });

  ngOnInit(): void {
    this.loadEnrollments();
  }

  private buildFilters(): EnrollmentFilter {
    const values = this.filterForm.getRawValue();

    return {
      search: values.search.trim() || undefined,
      courseId: values.courseId ? Number(values.courseId) : null,
      status: values.status === 'all' ? null : Number(values.status),
      fromDate: values.fromDate || undefined,
      toDate: values.toDate || undefined,
      sortBy: values.sortBy,
      sortOrder: values.sortOrder,
    };
  }

  loadEnrollments(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.enrollmentService
      .getEnrollments(
        this.pageNumber(),
        this.pageSize(),
        this.buildFilters(),
      )
      .subscribe({
        next: (response) => {
          this.enrollments.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading enrollments:', error);
          this.errorMessage.set('Unable to load enrollments.');
          this.isLoading.set(false);
        },
      });
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      courseId: '',
      status: 'all',
      fromDate: '',
      toDate: '',
      sortBy: 'date',
      sortOrder: 'desc',
    });

    this.pageNumber.set(1);
    this.loadEnrollments();
  }

  statusLabel(status: number): string {
    return status === 0 ? 'Active' : 'Cancelled';
  }

  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update(page => page + 1);
      this.loadEnrollments();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      this.loadEnrollments();
    }
  }
}
