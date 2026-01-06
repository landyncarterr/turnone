import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const { report, sessionData } = await request.json();

    if (!report || !sessionData) {
      return NextResponse.json(
        { error: 'Missing report or session data' },
        { status: 400 }
      );
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 25;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, align: 'left' | 'center' = 'left') => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const lines = doc.splitTextToSize(text, maxWidth);
      
      if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      lines.forEach((line: string) => {
        const xPos = align === 'center' 
          ? (pageWidth - doc.getTextWidth(line)) / 2 
          : margin;
        doc.text(line, xPos, yPosition);
        yPosition += fontSize * 0.5;
      });
    };

    // Centered Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const titleWidth = doc.getTextWidth('TurnOne Performance Report');
    doc.text('TurnOne Performance Report', (pageWidth - titleWidth) / 2, yPosition);
    yPosition += 12;

    // Horizontal line under title
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Session metadata in a clean format
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const metadata = [
      `Driver: ${sessionData.driver_name}`,
      `Track: ${sessionData.track}`,
      `Car: ${sessionData.car}`,
      `Session Type: ${sessionData.session_type}`,
      `Track Conditions: ${sessionData.conditions || 'Not specified'}`,
      `Best Lap: ${sessionData.best_lap}`,
      `Average Lap: ${sessionData.avg_lap}`
    ];

    metadata.forEach((item) => {
      doc.text(item, margin, yPosition);
      yPosition += 6;
    });
    
    yPosition += 8;

    // Report content with improved formatting
    const sections = report.split(/\n\n+/);
    sections.forEach((section: string, sectionIndex: number) => {
      const lines = section.split('\n');
      let isFirstLine = true;
      
      lines.forEach((line: string) => {
        if (line.match(/^\d+\.\s+\*\*.*\*\*/)) {
          // Section title - add spacing before (except first section)
          if (sectionIndex > 0) {
            yPosition += 8;
          }
          const title = line.replace(/\*\*/g, '').replace(/^\d+\.\s+/, '');
          addText(title, 14, true);
          yPosition += 4;
          isFirstLine = false;
        } else if (line.startsWith('•')) {
          // Bullet point with indentation
          const bulletText = line.trim();
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const bulletLines = doc.splitTextToSize(bulletText, maxWidth - 10);
          
          if (yPosition + (bulletLines.length * 5) > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          
          bulletLines.forEach((bulletLine: string, idx: number) => {
            doc.text(bulletLine, margin + 5, yPosition);
            yPosition += 5;
          });
        } else if (line.trim()) {
          // Regular paragraph
          if (isFirstLine && sectionIndex > 0) {
            yPosition += 2;
          }
          addText(line.trim(), 10);
          yPosition += 3;
          isFirstLine = false;
        }
      });
    });

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Performance_Report_${sessionData.driver_name}_${sessionData.track}_${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

