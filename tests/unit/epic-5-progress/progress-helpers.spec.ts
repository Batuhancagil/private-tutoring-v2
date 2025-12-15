/**
 * Epic 5, Story 5.4: Color-Coded Progress Indicators - Unit Tests
 * 
 * P0 Unit Tests for progress helper functions:
 * - Color coding logic (green/yellow/red)
 * - Threshold-based color determination
 * - Edge cases
 */

import { getProgressColor, getProgressColorClasses } from '@/lib/progress-helpers';

describe('Story 5.4: Progress Helpers [P0]', () => {
  describe('Color Coding Logic', () => {
    test('[P0] 5.4-UNIT-001: Accuracy 75% ≥ threshold 70% → green', () => {
      // Given: Accuracy is 75% and threshold is 70%
      const accuracy = 75;
      const threshold = 70;

      // When: Color is determined
      const result = getProgressColor(accuracy, threshold);

      // Then: Color is green, status is "On track"
      expect(result.color).toBe('green');
      expect(result.status).toBe('On track');
    });

    test('[P0] 5.4-UNIT-002: Accuracy 68% (threshold - 2%) → yellow', () => {
      // Given: Accuracy is 68% (between threshold-5% and threshold)
      const accuracy = 68;
      const threshold = 70;

      // When: Color is determined
      const result = getProgressColor(accuracy, threshold);

      // Then: Color is yellow, status is "Attention needed"
      expect(result.color).toBe('yellow');
      expect(result.status).toBe('Attention needed');
    });

    test('[P0] 5.4-UNIT-003: Accuracy 65% < (threshold - 5%) → red', () => {
      // Given: Accuracy is 65% (below threshold - 5%)
      const accuracy = 65;
      const threshold = 70;

      // When: Color is determined
      const result = getProgressColor(accuracy, threshold);

      // Then: Color is red, status is "Struggling"
      expect(result.color).toBe('red');
      expect(result.status).toBe('Struggling');
    });

    test('[P0] 5.4-UNIT-004: Edge case: accuracy = threshold → green', () => {
      // Given: Accuracy exactly equals threshold
      const accuracy = 70;
      const threshold = 70;

      // When: Color is determined
      const result = getProgressColor(accuracy, threshold);

      // Then: Color is green (≥ threshold)
      expect(result.color).toBe('green');
      expect(result.status).toBe('On track');
    });

    test('[P0] 5.4-UNIT-005: Edge case: accuracy = threshold - 5% → yellow', () => {
      // Given: Accuracy exactly equals threshold - 5%
      const accuracy = 65;
      const threshold = 70;

      // When: Color is determined
      const result = getProgressColor(accuracy, threshold);

      // Then: Color is yellow (in yellow range)
      expect(result.color).toBe('yellow');
      expect(result.status).toBe('Attention needed');
    });

    test('[P0] 5.4-UNIT-006: Null accuracy → red with "No data" status', () => {
      // Given: Accuracy is null
      const accuracy = null;
      const threshold = 70;

      // When: Color is determined
      const result = getProgressColor(accuracy, threshold);

      // Then: Color is red, status is "No data"
      expect(result.color).toBe('red');
      expect(result.status).toBe('No data');
    });

    test('[P0] 5.4-UNIT-007: Undefined accuracy → red with "No data" status', () => {
      // Given: Accuracy is undefined
      const accuracy = undefined;
      const threshold = 70;

      // When: Color is determined
      const result = getProgressColor(accuracy, threshold);

      // Then: Color is red, status is "No data"
      expect(result.color).toBe('red');
      expect(result.status).toBe('No data');
    });
  });

  describe('Color Classes', () => {
    test('[P0] 5.4-UNIT-008: Green color classes returned correctly', () => {
      // Given: Green color
      const color = 'green';

      // When: Color classes are retrieved
      const classes = getProgressColorClasses(color);

      // Then: Correct Tailwind classes are returned
      expect(classes.bg).toBe('bg-green-500');
      expect(classes.text).toBe('text-green-700 dark:text-green-300');
      expect(classes.border).toBe('border-green-500');
    });

    test('[P0] 5.4-UNIT-009: Yellow color classes returned correctly', () => {
      // Given: Yellow color
      const color = 'yellow';

      // When: Color classes are retrieved
      const classes = getProgressColorClasses(color);

      // Then: Correct Tailwind classes are returned
      expect(classes.bg).toBe('bg-yellow-500');
      expect(classes.text).toBe('text-yellow-700 dark:text-yellow-300');
      expect(classes.border).toBe('border-yellow-500');
    });

    test('[P0] 5.4-UNIT-010: Red color classes returned correctly', () => {
      // Given: Red color
      const color = 'red';

      // When: Color classes are retrieved
      const classes = getProgressColorClasses(color);

      // Then: Correct Tailwind classes are returned
      expect(classes.bg).toBe('bg-red-500');
      expect(classes.text).toBe('text-red-700 dark:text-red-300');
      expect(classes.border).toBe('border-red-500');
    });
  });
});

