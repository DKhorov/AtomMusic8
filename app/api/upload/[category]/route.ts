import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'https://atomglide.of.by';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ category: string }> }
) {
    const { category } = await params;
    const validCategories = ['audio', 'image', 'code', 'docs'];
    
    if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Неверная категория' }, { status: 400 });
    }

    try {
        const contentType = request.headers.get('Content-Type');
        const authHeader = request.headers.get('Authorization');
        const cookieHeader = request.headers.get('Cookie');
        
        // Read raw body as ArrayBuffer to preserve multipart boundaries
        const arrayBuffer = await request.arrayBuffer();
        
        const backendRes = await fetch(`${BACKEND_URL}/api/upload/${category}`, {
            method: 'POST',
            body: arrayBuffer,
            headers: {
                'Authorization': authHeader || '',
                'Cookie': cookieHeader || '',
                ...(contentType ? { 'Content-Type': contentType } : {}),
            },
        });

        const data = await backendRes.json();
        
        if (!backendRes.ok) {
            return NextResponse.json(data, { status: backendRes.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Upload proxy error:', error);
        return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 });
    }
}

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';