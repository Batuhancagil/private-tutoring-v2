-- CreateTable
CREATE TABLE "AccuracyAlert" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT,
    "lessonId" TEXT,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccuracyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccuracyAlert_studentId_idx" ON "AccuracyAlert"("studentId");

-- CreateIndex
CREATE INDEX "AccuracyAlert_topicId_idx" ON "AccuracyAlert"("topicId");

-- CreateIndex
CREATE INDEX "AccuracyAlert_lessonId_idx" ON "AccuracyAlert"("lessonId");

-- CreateIndex
CREATE INDEX "AccuracyAlert_resolved_idx" ON "AccuracyAlert"("resolved");

-- CreateIndex
CREATE INDEX "AccuracyAlert_createdAt_idx" ON "AccuracyAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "AccuracyAlert" ADD CONSTRAINT "AccuracyAlert_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccuracyAlert" ADD CONSTRAINT "AccuracyAlert_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccuracyAlert" ADD CONSTRAINT "AccuracyAlert_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

