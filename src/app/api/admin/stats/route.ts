import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const userId = decoded.split(':')[0];

    // Verify admin
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [totalStudents, totalCourses, totalPosts, totalEnrollments, activeEnrollments] = await Promise.all([
      db.user.count({ where: { role: 'student' } }),
      db.course.count(),
      db.post.count(),
      db.enrollment.count(),
      db.enrollment.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      stats: { totalStudents, totalCourses, totalPosts, totalEnrollments, activeEnrollments },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
