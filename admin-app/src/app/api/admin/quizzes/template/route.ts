import { generateExcelTemplate } from '@/lib/excel-quiz-importer';
import { verifyAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const userId = await verifyAdmin(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buffer = generateExcelTemplate();

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="deutsch_mit_omar_questions_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Download template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
