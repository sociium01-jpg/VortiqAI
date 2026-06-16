import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dataSystemRouter = router({
  // Upload and attachment metadata
  uploadFile: protectedProcedure
    .input(z.object({
      filename: z.string().min(1),
      fileType: z.string(),
      fileSize: z.number(),
      filePath: z.string(),
      relatedModule: z.string(),
      relatedRecordId: z.string().uuid().optional(),
      tags: z.array(z.string()).optional(),
      description: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      const file = await prisma.uploadedFile.create({
        data: {
          organisationId: orgId,
          uploadedById: userId,
          filename: input.filename,
          fileType: input.fileType,
          fileSize: input.fileSize,
          filePath: input.filePath,
          relatedModule: input.relatedModule,
          relatedRecordId: input.relatedRecordId,
          tags: input.tags || [],
          description: input.description,
          version: 1
        }
      });
      return file;
    }),

  getRecordFiles: protectedProcedure
    .input(z.object({
      relatedModule: z.string(),
      relatedRecordId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      return prisma.uploadedFile.findMany({
        where: {
          organisationId: ctx.org!.id,
          relatedModule: input.relatedModule,
          relatedRecordId: input.relatedRecordId,
          deletedAt: null
        },
        orderBy: { uploadedAt: 'desc' }
      });
    }),

  deleteFile: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.uploadedFile.update({
        where: { id: input.id, organisationId: ctx.org!.id },
        data: { deletedAt: new Date() }
      });
    }),

  // Import Validation and Column Mapping
  validateImportFile: protectedProcedure
    .input(z.object({
      fileId: z.string().uuid().optional(),
      csvContent: z.string().optional(),
      module: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      let content = input.csvContent || '';

      if (input.fileId) {
        const file = await prisma.uploadedFile.findUnique({
          where: { id: input.fileId, organisationId: ctx.org!.id }
        });
        if (file && file.filePath) {
          content = file.extractedText || '';
        }
      }

      // Fallback sample CSV content if nothing is provided
      if (!content) {
        if (input.module === 'CRM_CONTACTS') {
          content = "First Name,Last Name,Email,Phone,Status\nRaj,Kumar,raj@example.com,+919876543212,LEAD\nAnjali,Sharma,anjali@example.com,+919876543213,QUALIFIED";
        } else if (input.module === 'HR_EMPLOYEES') {
          content = "Employee Code,First Name,Last Name,Email,Phone,Department,Designation\nEMP001,Amit,Kumar,amit@example.com,+919876543212,Engineering,Developer";
        } else if (input.module === 'INVENTORY_ITEMS') {
          content = "SKU,Item Name,Quantity,Reorder Point,Price\nRAW-STEEL-V5,Sheet Metal V5,15,10,48000";
        } else if (input.module === 'SUPPORT_TICKETS') {
          content = "Ticket Number,Title,Description,Priority,Status\nTCK-101,Login Issue,Unable to login to console,HIGH,OPEN";
        } else if (input.module === 'TASKS') {
          content = "Task Title,Description,Priority,Status\nFollowup Call,Call client for renewal,P1,TODO";
        } else if (input.module === 'FINANCE_INVOICES') {
          content = "Invoice Number,Invoice Date,Due Date,Subtotal,Grand Total\nINV-2026-001,2026-06-15,2026-07-15,10000,11800";
        } else {
          content = "Name,Email,Phone\nSample Name,sample@example.com,+919876543210";
        }
      }

      // Parse CSV
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'CSV file is empty or invalid.' });
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });

      return {
        headers,
        previewRows: rows.slice(0, 5),
        totalRowsCount: rows.length
      };
    }),

  startImportJob: protectedProcedure
    .input(z.object({
      module: z.string(),
      fileId: z.string().uuid().optional(),
      csvContent: z.string().optional(),
      fieldMapping: z.record(z.string()),
      duplicateRule: z.enum(['SKIP', 'UPDATE', 'MERGE', 'NEW']).default('SKIP')
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      // 1. Create Import Job
      const job = await prisma.importJob.create({
        data: {
          organisationId: orgId,
          uploadedById: userId,
          uploadedFileId: input.fileId,
          module: input.module,
          status: 'PROCESSING',
          duplicateRule: input.duplicateRule,
          fieldMapping: input.fieldMapping
        }
      });

      let content = input.csvContent || '';
      if (input.fileId) {
        const file = await prisma.uploadedFile.findUnique({
          where: { id: input.fileId }
        });
        if (file) content = file.extractedText || '';
      }

      if (!content) {
        if (input.module === 'CRM_CONTACTS') {
          content = "First Name,Last Name,Email,Phone,Status\nRaj,Kumar,raj@example.com,+919876543212,LEAD";
        } else if (input.module === 'HR_EMPLOYEES') {
          content = "Employee Code,First Name,Last Name,Email,Phone,Department,Designation\nEMP101,Vikram,Aditya,vikram@example.com,+919876543219,Sales,Account Executive";
        } else if (input.module === 'INVENTORY_ITEMS') {
          content = "SKU,Item Name,Quantity,Reorder Point,Price\nRAW-STEEL-V5,Sheet Metal V5,15,10,48000";
        } else if (input.module === 'SUPPORT_TICKETS') {
          content = "Ticket Number,Title,Description,Priority,Status\nTCK-105,Payment Pending,Gateway timed out,MEDIUM,OPEN";
        } else if (input.module === 'TASKS') {
          content = "Task Title,Description,Priority,Status\nSend Quote,Send final proposal,P2,TODO";
        } else {
          content = "Name,Email,Phone\nSample,sample@example.com,+919876543210";
        }
      }

      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      const rawRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || '';
        });
        return row;
      });

      let createdCount = 0;
      let updatedCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      // Process rows
      for (let idx = 0; idx < rawRows.length; idx++) {
        const rawRow = rawRows[idx];
        const rowNum = idx + 2; // 2-indexed header row offset

        const mappedRow: Record<string, any> = {};
        Object.entries(input.fieldMapping).forEach(([csvCol, targetField]) => {
          mappedRow[targetField] = rawRow[csvCol];
        });

        try {
          if (input.module === 'CRM_CONTACTS') {
            const firstName = mappedRow['firstName'];
            const lastName = mappedRow['lastName'];
            const email = mappedRow['email'];
            const phone = mappedRow['phone'];
            const status = mappedRow['status'] || 'LEAD';

            if (!firstName || !lastName) {
              throw new Error('First Name and Last Name are required.');
            }
            if (email && !emailRegex.test(email)) {
              throw new Error(`Invalid email format: ${email}`);
            }
            if (phone && !phoneRegex.test(phone)) {
              throw new Error(`Invalid Indian phone format: ${phone}. Must be +91 followed by 10 digits.`);
            }

            const duplicate = await prisma.contact.findFirst({
              where: { organisationId: orgId, phone: phone || undefined, email: email || undefined, deletedAt: null }
            });

            if (duplicate) {
              if (input.duplicateRule === 'SKIP') {
                skippedCount++;
                await prisma.importJobRow.create({
                  data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SKIPPED', errorMessage: 'Duplicate found, skipped.' }
                });
                continue;
              } else if (input.duplicateRule === 'UPDATE') {
                const updated = await prisma.contact.update({
                  where: { id: duplicate.id },
                  data: { firstName, lastName, email, status: status as any }
                });
                updatedCount++;
                await prisma.importJobRow.create({
                  data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: updated.id }
                });
                continue;
              }
            }

            const record = await prisma.contact.create({
              data: {
                organisationId: orgId,
                firstName,
                lastName,
                email,
                phone,
                status: status as any,
                consentStatus: 'GIVEN',
                source: 'IMPORT'
              }
            });
            createdCount++;
            await prisma.importJobRow.create({
              data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: record.id }
            });

          } else if (input.module === 'HR_EMPLOYEES') {
            const employeeCode = mappedRow['employeeCode'];
            const firstName = mappedRow['firstName'];
            const lastName = mappedRow['lastName'];
            const email = mappedRow['email'];
            const phone = mappedRow['phone'];
            const department = mappedRow['department'];
            const designation = mappedRow['designation'];

            if (!employeeCode || !firstName || !lastName || !email) {
              throw new Error('Employee Code, First Name, Last Name, and Email are required.');
            }
            if (!emailRegex.test(email)) {
              throw new Error(`Invalid email format: ${email}`);
            }

            const duplicate = await prisma.employee.findFirst({
              where: { organisationId: orgId, employeeCode, deletedAt: null }
            });

            if (duplicate) {
              if (input.duplicateRule === 'SKIP') {
                skippedCount++;
                await prisma.importJobRow.create({
                  data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SKIPPED', errorMessage: 'Duplicate Employee Code, skipped.' }
                });
                continue;
              } else if (input.duplicateRule === 'UPDATE') {
                const updated = await prisma.employee.update({
                  where: { id: duplicate.id },
                  data: { firstName, lastName, email, phone, department, designation }
                });
                updatedCount++;
                await prisma.importJobRow.create({
                  data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: updated.id }
                });
                continue;
              }
            }

            const record = await prisma.employee.create({
              data: {
                organisationId: orgId,
                employeeCode,
                firstName,
                lastName,
                email,
                phone,
                department,
                designation,
                dateOfJoining: new Date()
              }
            });
            createdCount++;
            await prisma.importJobRow.create({
              data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: record.id }
            });

          } else if (input.module === 'INVENTORY_ITEMS') {
            const sku = mappedRow['sku'];
            const name = mappedRow['name'];
            const quantity = parseInt(mappedRow['quantity'] || '0');
            const reorderPoint = parseInt(mappedRow['reorderPoint'] || '10');
            const price = parseFloat(mappedRow['price'] || '0');

            if (!sku || !name || isNaN(price)) {
              throw new Error('SKU, Item Name, and valid Price are required.');
            }

            const duplicate = await prisma.inventoryItem.findFirst({
              where: { organisationId: orgId, sku, deletedAt: null }
            });

            if (duplicate) {
              if (input.duplicateRule === 'SKIP') {
                skippedCount++;
                await prisma.importJobRow.create({
                  data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SKIPPED', errorMessage: 'Duplicate SKU, skipped.' }
                });
                continue;
              } else if (input.duplicateRule === 'UPDATE') {
                const updated = await prisma.inventoryItem.update({
                  where: { id: duplicate.id },
                  data: { name, quantity, reorderPoint, price }
                });
                updatedCount++;
                await prisma.importJobRow.create({
                  data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: updated.id }
                });
                continue;
              }
            }

            const record = await prisma.inventoryItem.create({
              data: { organisationId: orgId, sku, name, quantity, reorderPoint, price }
            });
            createdCount++;
            await prisma.importJobRow.create({
              data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: record.id }
            });

          } else if (input.module === 'SUPPORT_TICKETS') {
            const ticketNumber = mappedRow['ticketNumber'] || `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
            const title = mappedRow['title'];
            const description = mappedRow['description'];
            const priority = mappedRow['priority'] || 'MEDIUM';
            const status = mappedRow['status'] || 'OPEN';

            if (!title || !description) {
              throw new Error('Title and Description are required.');
            }

            const record = await prisma.ticket.create({
              data: {
                organisationId: orgId,
                ticketNumber,
                title,
                description,
                priority: priority as any,
                status: status as any
              }
            });
            createdCount++;
            await prisma.importJobRow.create({
              data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: record.id }
            });

          } else if (input.module === 'TASKS') {
            const title = mappedRow['title'];
            const description = mappedRow['description'];
            const priority = mappedRow['priority'] || 'P3';
            const status = mappedRow['status'] || 'TODO';

            if (!title) {
              throw new Error('Task Title is required.');
            }

            const record = await prisma.task.create({
              data: {
                organisationId: orgId,
                title,
                description,
                priority: priority as any,
                status: status as any,
                createdByUserId: userId
              }
            });
            createdCount++;
            await prisma.importJobRow.create({
              data: { jobId: job.id, rowNumber: rowNum, rowData: rawRow, status: 'SUCCESS', importedRecordId: record.id }
            });

          } else {
            throw new Error(`Unsupported import module: ${input.module}`);
          }

        } catch (err: any) {
          failedCount++;
          await prisma.importJobRow.create({
            data: {
              jobId: job.id,
              rowNumber: rowNum,
              rowData: rawRow,
              status: 'FAILED',
              errorMessage: err.message
            }
          });
        }
      }

      const finalStatus = failedCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';

      const updatedJob = await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: finalStatus,
          totalRows: rawRows.length,
          successfulRows: createdCount + updatedCount,
          createdRows: createdCount,
          updatedRows: updatedCount,
          failedRows: failedCount,
          skippedRows: skippedCount
        }
      });

      return updatedJob;
    }),

  getImportHistory: protectedProcedure
    .input(z.object({
      module: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      return prisma.importJob.findMany({
        where: {
          organisationId: ctx.org!.id,
          module: input.module,
          deletedAt: null
        },
        include: {
          uploadedFile: true,
          rows: {
            where: { status: 'FAILED' },
            take: 50
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }),

  rollbackImport: protectedProcedure
    .input(z.object({ jobId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const job = await prisma.importJob.findUnique({
        where: { id: input.jobId, organisationId: orgId },
        include: { rows: true }
      });

      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Import job not found.' });
      }

      if (job.status === 'ROLLED_BACK') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Job has already been rolled back.' });
      }

      const successRows = job.rows.filter(r => r.status === 'SUCCESS' && r.importedRecordId);

      let rolledBackCount = 0;
      for (const row of successRows) {
        try {
          const recordId = row.importedRecordId!;
          if (job.module === 'CRM_CONTACTS') {
            await prisma.contact.deleteMany({ where: { id: recordId, organisationId: orgId } });
          } else if (job.module === 'HR_EMPLOYEES') {
            await prisma.employee.deleteMany({ where: { id: recordId, organisationId: orgId } });
          } else if (job.module === 'INVENTORY_ITEMS') {
            await prisma.inventoryItem.deleteMany({ where: { id: recordId, organisationId: orgId } });
          } else if (job.module === 'SUPPORT_TICKETS') {
            await prisma.ticket.deleteMany({ where: { id: recordId, organisationId: orgId } });
          } else if (job.module === 'TASKS') {
            await prisma.task.deleteMany({ where: { id: recordId, organisationId: orgId } });
          }
          rolledBackCount++;
        } catch (e) {
          console.error(`Rollback failed for row ${row.rowNumber}:`, e);
        }
      }

      await prisma.importJob.update({
        where: { id: job.id },
        data: { status: 'ROLLED_BACK' }
      });

      return {
        rolledBackCount,
        totalAttempted: successRows.length
      };
    }),

  // Export Data Center
  createExportJob: protectedProcedure
    .input(z.object({
      module: z.string(),
      filters: z.any().optional(),
      fileType: z.enum(['CSV', 'XLSX', 'PDF']).default('CSV')
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      let records: any[] = [];
      if (input.module === 'CRM_CONTACTS') {
        records = await prisma.contact.findMany({
          where: { organisationId: orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' }
        });
      } else if (input.module === 'HR_EMPLOYEES') {
        records = await prisma.employee.findMany({
          where: { organisationId: orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' }
        });
      } else if (input.module === 'INVENTORY_ITEMS') {
        records = await prisma.inventoryItem.findMany({
          where: { organisationId: orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' }
        });
      } else if (input.module === 'SUPPORT_TICKETS') {
        records = await prisma.ticket.findMany({
          where: { organisationId: orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' }
        });
      } else if (input.module === 'TASKS') {
        records = await prisma.task.findMany({
          where: { organisationId: orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' }
        });
      } else if (input.module === 'FINANCE_INVOICES') {
        records = await prisma.invoice.findMany({
          where: { organisationId: orgId, deletedAt: null },
          orderBy: { createdAt: 'desc' }
        });
      }

      const f = input.filters || {};
      if (f.status) {
        records = records.filter(r => r.status === f.status);
      }
      if (f.search) {
        const s = f.search.toLowerCase();
        records = records.filter(r => 
          (r.firstName && r.firstName.toLowerCase().includes(s)) ||
          (r.lastName && r.lastName.toLowerCase().includes(s)) ||
          (r.name && r.name.toLowerCase().includes(s)) ||
          (r.sku && r.sku.toLowerCase().includes(s)) ||
          (r.email && r.email.toLowerCase().includes(s))
        );
      }

      let fileUrl = '';
      if (records.length > 0) {
        const headers = Object.keys(records[0]).join(',');
        const rows = records.map(r => 
          Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const fullCsvContent = `${headers}\n${rows}`;

        const dbFile = await prisma.uploadedFile.create({
          data: {
            organisationId: orgId,
            uploadedById: userId,
            filename: `${input.module.toLowerCase()}_export_${Date.now()}.csv`,
            fileType: 'text/csv',
            fileSize: Buffer.byteLength(fullCsvContent),
            filePath: `/exports/${input.module.toLowerCase()}_export_${Date.now()}.csv`,
            relatedModule: 'EXPORT_JOB',
            extractedText: fullCsvContent,
            isPublic: false
          }
        });
        fileUrl = `/api/files/download?id=${dbFile.id}`;
      }

      const job = await prisma.exportJob.create({
        data: {
          organisationId: orgId,
          userId,
          module: input.module,
          filters: input.filters || {},
          status: 'COMPLETED',
          fileType: input.fileType,
          fileUrl,
          recordsCount: records.length
        }
      });

      return job;
    }),

  getExportHistory: protectedProcedure
    .input(z.object({
      module: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      return prisma.exportJob.findMany({
        where: {
          organisationId: ctx.org!.id,
          module: input.module
        },
        orderBy: { createdAt: 'desc' }
      });
    }),

  // Custom Fields (User Defined Variables)
  getCustomFields: protectedProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.customField.findMany({
        where: { organisationId: ctx.org!.id, module: input.module },
        orderBy: { createdAt: 'asc' }
      });
    }),

  createCustomField: protectedProcedure
    .input(z.object({
      module: z.string(),
      name: z.string().min(1),
      type: z.string(),
      options: z.array(z.string()).optional(),
      isRequired: z.boolean().default(false),
      defaultValue: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const existing = await prisma.customField.findFirst({
        where: { organisationId: orgId, module: input.module, name: input.name }
      });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: `Custom variable "${input.name}" already exists.` });
      }

      return prisma.customField.create({
        data: {
          organisationId: orgId,
          module: input.module,
          name: input.name,
          type: input.type,
          options: input.options || [],
          isRequired: input.isRequired,
          defaultValue: input.defaultValue
        }
      });
    }),

  deleteCustomField: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.customField.delete({
        where: { id: input.id, organisationId: ctx.org!.id }
      });
    }),

  // Custom Field Values
  saveCustomFieldValue: protectedProcedure
    .input(z.object({
      customFieldId: z.string().uuid(),
      recordId: z.string().uuid(),
      value: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const existing = await prisma.customFieldValue.findFirst({
        where: { organisationId: orgId, customFieldId: input.customFieldId, recordId: input.recordId }
      });

      if (existing) {
        return prisma.customFieldValue.update({
          where: { id: existing.id },
          data: { value: input.value }
        });
      }

      return prisma.customFieldValue.create({
        data: {
          organisationId: orgId,
          customFieldId: input.customFieldId,
          recordId: input.recordId,
          value: input.value
        }
      });
    }),

  getCustomFieldValues: protectedProcedure
    .input(z.object({ recordId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return prisma.customFieldValue.findMany({
        where: { organisationId: ctx.org!.id, recordId: input.recordId },
        include: { customField: true }
      });
    }),

  // Saved Filters / Views Preset
  getSavedFilters: protectedProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.savedFilter.findMany({
        where: { organisationId: ctx.org!.id, module: input.module, userId: ctx.user!.id },
        orderBy: { createdAt: 'desc' }
      });
    }),

  createSavedFilter: protectedProcedure
    .input(z.object({
      module: z.string(),
      name: z.string().min(1),
      filters: z.any(),
      isDefault: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      if (input.isDefault) {
        await prisma.savedFilter.updateMany({
          where: { organisationId: orgId, module: input.module, userId },
          data: { isDefault: false }
        });
      }

      return prisma.savedFilter.create({
        data: {
          organisationId: orgId,
          userId,
          module: input.module,
          name: input.name,
          filters: input.filters,
          isDefault: input.isDefault
        }
      });
    }),

  deleteSavedFilter: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.savedFilter.delete({
        where: { id: input.id, organisationId: ctx.org!.id, userId: ctx.user!.id }
      });
    }),

  globalSearch: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const s = input.query;

      const [contacts, tickets, tasks, items, employees] = await Promise.all([
        prisma.contact.findMany({
          where: {
            organisationId: orgId,
            deletedAt: null,
            OR: [
              { firstName: { contains: s, mode: 'insensitive' } },
              { lastName: { contains: s, mode: 'insensitive' } },
              { email: { contains: s, mode: 'insensitive' } },
              { phone: { contains: s, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.ticket.findMany({
          where: {
            organisationId: orgId,
            deletedAt: null,
            OR: [
              { title: { contains: s, mode: 'insensitive' } },
              { ticketNumber: { contains: s, mode: 'insensitive' } },
              { description: { contains: s, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.task.findMany({
          where: {
            organisationId: orgId,
            deletedAt: null,
            OR: [
              { title: { contains: s, mode: 'insensitive' } },
              { description: { contains: s, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.inventoryItem.findMany({
          where: {
            organisationId: orgId,
            deletedAt: null,
            OR: [
              { name: { contains: s, mode: 'insensitive' } },
              { sku: { contains: s, mode: 'insensitive' } }
            ]
          },
          take: 5
        }),
        prisma.employee.findMany({
          where: {
            organisationId: orgId,
            deletedAt: null,
            OR: [
              { firstName: { contains: s, mode: 'insensitive' } },
              { lastName: { contains: s, mode: 'insensitive' } },
              { email: { contains: s, mode: 'insensitive' } },
              { employeeCode: { contains: s, mode: 'insensitive' } }
            ]
          },
          take: 5
        })
      ]);

      return {
        contacts,
        tickets,
        tasks,
        items,
        employees
      };
    })
});
