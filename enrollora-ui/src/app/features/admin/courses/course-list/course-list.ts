
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CourseService } from '../course.service';
import { CourseResponse } from '../course.models';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-list.html',
  styleUrl: './course-list.css',
})
export class CourseListComponent implements OnInit {
  private courseService = inject(CourseService);
  private fb = inject(FormBuilder);

  // Course list
  courses = signal<CourseResponse[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination
  pageNumber = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  // Add and Edit form
  showCourseForm = signal(false);
  isEditMode = signal(false);
  editingCourseId = signal<number | null>(null);
  isSaving = signal(false);
  formError = signal('');

  // Deactivate course
  actionError = signal('');
  deactivatingCourseId = signal<number | null>(null);

  // Reactive form
  courseForm = this.fb.nonNullable.group({
    courseName: ['', [Validators.required, Validators.maxLength(150)]],
    duration: ['', [Validators.required, Validators.maxLength(80)]],
    fees: [0, [Validators.required, Validators.min(0), Validators.max(999999999)]],
    capacity: [1, [Validators.required, Validators.min(1), Validators.max(100000)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadCourses();
  }

  // GET: Load courses
  loadCourses(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.courseService
      .getCourses(this.pageNumber(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.courses.set(response.items);
          this.totalRecords.set(response.totalRecords);
          this.totalPages.set(response.totalPages);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.errorMessage.set('Unable to load courses.');
          this.isLoading.set(false);
        },
      });
  }

  // Open form for adding a new course
  openCreateForm(): void {
    this.isEditMode.set(false);
    this.editingCourseId.set(null);
    this.formError.set('');

    this.courseForm.reset({
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    });

    this.courseForm.markAsUntouched();
    this.showCourseForm.set(true);
  }

  // Open form with existing course details for editing
  openEditForm(course: CourseResponse): void {
    this.isEditMode.set(true);
    this.editingCourseId.set(course.courseId);
    this.formError.set('');

    this.courseForm.reset({
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      capacity: course.capacity,
      isActive: course.isActive,
    });

    this.courseForm.markAsUntouched();
    this.showCourseForm.set(true);
  }

  // Close Add/Edit form
  closeCourseForm(): void {
    if (this.isSaving()) {
      return;
    }

    this.showCourseForm.set(false);
    this.isEditMode.set(false);
    this.editingCourseId.set(null);
    this.formError.set('');

    this.courseForm.reset({
      courseName: '',
      duration: '',
      fees: 0,
      capacity: 1,
      isActive: true,
    });
  }

  // POST: Create or PUT: Update course
  saveCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    const request = this.courseForm.getRawValue();
    const courseId = this.editingCourseId();

    this.isSaving.set(true);
    this.formError.set('');

    const onSuccess = (): void => {
      this.isSaving.set(false);
      this.closeCourseForm();

      this.pageNumber.set(1);
      this.loadCourses();
    };

    const onError = (error: any): void => {
      console.error('Error saving course:', error);

      this.formError.set(
        error?.error?.detail ||
        error?.error?.title ||
        error?.error?.message ||
        'Unable to save the course. Please try again.'
      );

      this.isSaving.set(false);
    };

    if (courseId !== null) {
      this.courseService.updateCourse(courseId, request).subscribe({
        next: onSuccess,
        error: onError,
      });
    } else {
      this.courseService.createCourse(request).subscribe({
        next: onSuccess,
        error: onError,
      });
    }
  }

  // DELETE: Soft deactivate a course
  deactivateCourse(course: CourseResponse): void {
    if (!course.isActive) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${course.courseName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.actionError.set('');
    this.deactivatingCourseId.set(course.courseId);

    this.courseService.deactivateCourse(course.courseId).subscribe({
      next: () => {
        this.deactivatingCourseId.set(null);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error deactivating course:', error);

        this.actionError.set(
          error?.error?.detail ||
          error?.error?.title ||
          error?.error?.message ||
          'Unable to deactivate this course. Please try again.'
        );

        this.deactivatingCourseId.set(null);
      },
    });
  }

  // Pagination
  nextPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      this.loadCourses();
    }
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      this.loadCourses();
    }
  }
}
