import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

export interface NINTemplateOptions {
  templateType: 'classic' | 'premium' | 'executive' | 'quantum';
  includePhoto: boolean;
  includeQR: boolean;
  includeSecurityFeatures: boolean;
  premiumFeatures: string[];
}

export interface NINData {
  nin: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber?: string;
  email?: string;
  address: string;
  lga: string;
  state: string;
  nationality: string;
  enrollmentDate: string;
  photo?: Buffer | string;
  signature?: Buffer | string;
}

@Injectable()
export class NinTemplateService {
  private readonly premiumColors = {
    classic: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#f8fafc',
    },
    premium: {
      primary: '#1e3a8a',
      secondary: '#1d4ed8',
      accent: '#2563eb',
      background: '#f1f5f9',
      gold: '#f59e0b',
    },
    executive: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#334155',
      background: '#ffffff',
      gold: '#d97706',
      silver: '#64748b',
    },
    quantum: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#0f0f23',
      quantum: '#06b6d4',
      neural: '#10b981',
    },
  };

  async generatePremiumTemplate(data: NINData, options: NINTemplateOptions): Promise<Buffer> {
    const doc = new PDFDocument({
      size: [350, 550],
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const colors = this.premiumColors[options.templateType];

    // Generate security features
    if (options.includeSecurityFeatures) {
      this.addSecurityFeatures(doc, colors);
    }

    // Template-specific design
    switch (options.templateType) {
      case 'classic':
        await this.generateClassicTemplate(doc, data, colors, options);
        break;
      case 'premium':
        await this.renderPremiumTemplate(doc, data, colors, options);
        break;
      case 'executive':
        await this.generateExecutiveTemplate(doc, data, colors, options);
        break;
      case 'quantum':
        await this.generateQuantumTemplate(doc, data, colors, options);
        break;
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);
    });
  }

  private addSecurityFeatures(doc: any, colors: any): void {
    // Add holographic pattern
    for (let i = 0; i < 50; i++) {
      doc.save();
      doc.rotate(Math.random() * 360);
      doc
        .lineWidth(0.5)
        .strokeColor(colors.accent + '40')
        .moveTo(-200, Math.random() * 600)
        .lineTo(600, Math.random() * 600)
        .stroke();
      doc.restore();
    }

    // Add microtext border
    const microtext = 'NIMC NIN VERIFICATION ';
    doc.save();
    doc.fontSize(2);
    doc.fillColor(colors.accent + '60');
    
    // Top border
    for (let x = 0; x < 350; x += 10) {
      doc.text(microtext, x, 5, { width: 10 });
    }
    
    // Bottom border
    for (let x = 0; x < 350; x += 10) {
      doc.text(microtext, x, 540, { width: 10 });
    }
    doc.restore();
  }

  private async generateClassicTemplate(doc: any, data: NINData, colors: any, options: NINTemplateOptions): Promise<void> {
    // Header with Nigeria Coat of Arms
    await this.addNigeriaHeader(doc, colors);

    // Title
    doc.fontSize(16).fillColor(colors.primary).text('NATIONAL IDENTIFICATION SLIP', 0, 80, { align: 'center' });
    
    // NIN Section
    doc.fontSize(12).fillColor(colors.secondary).text('National Identification Number (NIN):', 20, 110);
    doc.fontSize(14).fillColor(colors.primary).text(data.nin, 20, 125);

    // Personal Information
    let y = 150;
    doc.fontSize(10).fillColor(colors.secondary).text('Full Name:', 20, y);
    doc.fontSize(12).fillColor(colors.primary).text(`${data.lastName} ${data.firstName} ${data.middleName || ''}`, 20, y + 15);

    y += 40;
    doc.fontSize(10).fillColor(colors.secondary).text('Date of Birth:', 20, y);
    doc.fontSize(12).fillColor(colors.primary).text(data.dateOfBirth, 20, y + 15);

    y += 40;
    doc.fontSize(10).fillColor(colors.secondary).text('Gender:', 20, y);
    doc.fontSize(12).fillColor(colors.primary).text(data.gender, 20, y + 15);

    y += 40;
    doc.fontSize(10).fillColor(colors.secondary).text('Address:', 20, y);
    doc.fontSize(10).fillColor(colors.primary).text(data.address, 20, y + 15);
    doc.fontSize(10).fillColor(colors.primary).text(`${data.lga}, ${data.state}`, 20, y + 30);

    // QR Code
    if (options.includeQR) {
      const qrData = await QRCode.toBuffer(JSON.stringify({
        nin: data.nin,
        name: `${data.lastName} ${data.firstName}`,
        verificationUrl: `https://dorce.ai/api/nin/verify/${data.nin}`,
      }), { width: 80 });
      
      doc.image(qrData, 250, 150, { width: 80, height: 80 });
      doc.fontSize(8).fillColor(colors.secondary).text('Scan to Verify', 250, 235, { align: 'center' });
    }

    // Footer
    doc.fontSize(8).fillColor(colors.secondary).text('Generated by Dorce.ai - Premium Service', 0, 520, { align: 'center' });
  }

  private async renderPremiumTemplate(doc: any, data: NINData, colors: any, options: NINTemplateOptions): Promise<void> {
    // Premium header with gold accents
    await this.addPremiumHeader(doc, colors);

    // Premium title with gold
    doc.fontSize(18).fillColor(colors.gold).text('PREMIUM NATIONAL IDENTIFICATION SLIP', 0, 90, { align: 'center' });
    
    // Decorative line
    doc.lineWidth(2).strokeColor(colors.gold).moveTo(50, 110).lineTo(300, 110).stroke();

    // Enhanced NIN display
    doc.fontSize(12).fillColor(colors.primary).text('National Identification Number:', 20, 130);
    doc.fontSize(16).fillColor(colors.gold).text(data.nin, 20, 145);

    // Premium layout with photo placeholder
    const leftColumn = 20;
    const rightColumn = 200;
    let y = 170;

    // Left column
    doc.fontSize(11).fillColor(colors.secondary).text('Full Name:', leftColumn, y);
    doc.fontSize(13).fillColor(colors.primary).text(`${data.lastName}, ${data.firstName} ${data.middleName || ''}`, leftColumn, y + 18);

    y += 50;
    doc.fontSize(11).fillColor(colors.secondary).text('Date of Birth:', leftColumn, y);
    doc.fontSize(13).fillColor(colors.primary).text(data.dateOfBirth, leftColumn, y + 18);

    y += 50;
    doc.fontSize(11).fillColor(colors.secondary).text('Gender:', leftColumn, y);
    doc.fontSize(13).fillColor(colors.primary).text(data.gender, leftColumn, y + 18);

    // Enhanced QR Code with premium styling
    if (options.includeQR) {
      const qrData = await QRCode.toBuffer(JSON.stringify({
        nin: data.nin,
        name: `${data.lastName} ${data.firstName}`,
        verificationUrl: `https://dorce.ai/api/nin/verify/${data.nin}`,
        premium: true,
        timestamp: new Date().toISOString(),
      }), { 
        width: 100,
        color: {
          dark: colors.primary,
          light: colors.background,
        },
      });
      
      doc.image(qrData, rightColumn, 170, { width: 100, height: 100 });
      doc.fontSize(9).fillColor(colors.gold).text('PREMIUM VERIFICATION', rightColumn, 275, { align: 'center' });
    }

    // Address section
    y = 320;
    doc.fontSize(11).fillColor(colors.secondary).text('Residential Address:', leftColumn, y);
    doc.fontSize(11).fillColor(colors.primary).text(data.address, leftColumn, y + 18);
    doc.fontSize(11).fillColor(colors.primary).text(`${data.lga}, ${data.state}`, leftColumn, y + 35);

    // Premium security features
    doc.lineWidth(1).strokeColor(colors.gold).moveTo(20, 400).lineTo(330, 400).stroke();
    doc.fontSize(9).fillColor(colors.secondary).text('Premium Security Features:', 20, 410);
    doc.fontSize(8).fillColor(colors.primary).text('• Holographic Verification • Encrypted QR Code • Premium Design', 20, 425);

    // Premium footer
    doc.fontSize(9).fillColor(colors.gold).text('PREMIUM SERVICE BY DORCE.AI', 0, 520, { align: 'center' });
    doc.fontSize(8).fillColor(colors.secondary).text('Authentic • Secure • Premium', 0, 535, { align: 'center' });
  }

  private async generateExecutiveTemplate(doc: any, data: NINData, colors: any, options: NINTemplateOptions): Promise<void> {
    // Executive header with sophisticated design
    await this.addExecutiveHeader(doc, colors);

    // Executive title
    doc.fontSize(20).fillColor(colors.gold).text('EXECUTIVE NATIONAL IDENTIFICATION', 0, 100, { align: 'center' });
    doc.fontSize(16).fillColor(colors.silver).text('CERTIFIED DOCUMENT', 0, 120, { align: 'center' });

    // Executive border
    doc.lineWidth(3).strokeColor(colors.gold).rect(15, 140, 320, 350).stroke();

    // Executive NIN section
    doc.fontSize(14).fillColor(colors.primary).text('National Identification Number (NIN):', 25, 160);
    doc.fontSize(18).fillColor(colors.gold).font('Helvetica-Bold').text(data.nin, 25, 180);
    doc.font('Helvetica');

    // Executive photo placeholder
    if (options.includePhoto) {
      doc.lineWidth(2).strokeColor(colors.silver).rect(240, 160, 80, 80).stroke();
      doc.fontSize(8).fillColor(colors.secondary).text('PHOTO', 260, 200, { align: 'center' });
    }

    // Executive information layout
    let y = 250;
    const sectionHeight = 45;

    // Name section
    doc.fontSize(12).fillColor(colors.secondary).text('HOLDER\'S NAME:', 25, y);
    doc.fontSize(14).fillColor(colors.primary).font('Helvetica-Bold').text(`${data.lastName}, ${data.firstName} ${data.middleName || ''}`, 25, y + 20);
    doc.font('Helvetica');

    y += sectionHeight;
    doc.fontSize(12).fillColor(colors.secondary).text('DATE OF BIRTH:', 25, y);
    doc.fontSize(14).fillColor(colors.primary).text(data.dateOfBirth, 25, y + 20);

    y += sectionHeight;
    doc.fontSize(12).fillColor(colors.secondary).text('GENDER:', 25, y);
    doc.fontSize(14).fillColor(colors.primary).text(data.gender, 25, y + 20);

    y += sectionHeight;
    doc.fontSize(12).fillColor(colors.secondary).text('NATIONALITY:', 25, y);
    doc.fontSize(14).fillColor(colors.primary).text(data.nationality, 25, y + 20);

    // Executive QR Code
    if (options.includeQR) {
      const qrData = await QRCode.toBuffer(JSON.stringify({
        nin: data.nin,
        name: `${data.lastName} ${data.firstName}`,
        verificationUrl: `https://dorce.ai/api/nin/verify/${data.nin}`,
        executive: true,
        certified: true,
      }), { width: 70 });
      
      doc.image(qrData, 260, 420, { width: 70, height: 70 });
    }

    // Executive certification
    doc.fontSize(10).fillColor(colors.gold).text('EXECUTIVE CERTIFICATION', 25, 420);
    doc.fontSize(8).fillColor(colors.secondary).text('This document is certified under executive standards', 25, 435);
    doc.fontSize(8).fillColor(colors.secondary).text('with advanced security features and premium verification.', 25, 448);

    // Executive footer
    doc.lineWidth(2).strokeColor(colors.gold).moveTo(50, 510).lineTo(300, 510).stroke();
    doc.fontSize(10).fillColor(colors.gold).text('EXECUTIVE SERVICE', 0, 515, { align: 'center' });
    doc.fontSize(8).fillColor(colors.silver).text('Powered by Dorce.ai Neural Core', 0, 530, { align: 'center' });
  }

  private async generateQuantumTemplate(doc: any, data: NINData, colors: any, options: NINTemplateOptions): Promise<void> {
    // Quantum header with neural design
    await this.addQuantumHeader(doc, colors);

    // Quantum title with neural effects
    doc.fontSize(22).fillColor(colors.quantum).text('QUANTUM NATIONAL IDENTIFICATION', 0, 90, { align: 'center' });
    doc.fontSize(18).fillColor(colors.neural).text('NEURAL CORE CERTIFIED', 0, 115, { align: 'center' });

    // Quantum neural background pattern
    this.addQuantumPattern(doc, colors);

    // Quantum NIN with neural styling
    doc.fontSize(16).fillColor(colors.quantum).text('Quantum NIN:', 20, 150);
    doc.fontSize(20).fillColor(colors.neural).font('Helvetica-Bold').text(data.nin, 20, 170);
    doc.font('Helvetica');

    // Quantum data visualization
    await this.addQuantumDataViz(doc, data, colors, 200);

    // Quantum information grid
    const gridPositions = [
      { x: 20, y: 280, label: 'Neural Identity', value: `${data.lastName} ${data.firstName}` },
      { x: 200, y: 280, label: 'Quantum Birth', value: data.dateOfBirth },
      { x: 20, y: 340, label: 'Gender Matrix', value: data.gender },
      { x: 200, y: 340, label: 'Nationality Node', value: data.nationality },
    ];

    gridPositions.forEach(pos => {
      doc.fontSize(10).fillColor(colors.quantum).text(pos.label, pos.x, pos.y);
      doc.fontSize(12).fillColor(colors.neural).text(pos.value, pos.x, pos.y + 20);
    });

    // Advanced Quantum QR Code
    if (options.includeQR) {
      const qrData = await QRCode.toBuffer(JSON.stringify({
        nin: data.nin,
        name: `${data.lastName} ${data.firstName}`,
        verificationUrl: `https://dorce.ai/api/nin/verify/${data.nin}`,
        quantum: true,
        neural: true,
        timestamp: Date.now(),
        consciousness: Math.random(), // Simulate consciousness score
      }), { 
        width: 90,
        color: {
          dark: colors.quantum,
          light: colors.background,
        },
      });
      
      doc.image(qrData, 130, 400, { width: 90, height: 90 });
      doc.fontSize(8).fillColor(colors.neural).text('QUANTUM SCAN', 130, 495, { align: 'center' });
    }

    // Quantum neural signature
    doc.fontSize(9).fillColor(colors.quantum).text('Quantum Neural Signature:', 20, 520);
    doc.fontSize(7).fillColor(colors.neural).text(this.generateQuantumSignature(data), 20, 535);

    // Quantum footer
    doc.fontSize(10).fillColor(colors.quantum).text('QUANTUM NEURAL CORE', 0, 550, { align: 'center' });
  }

  private async addNigeriaHeader(doc: any, colors: any): Promise<void> {
    // Nigeria flag colors background
    doc.rect(0, 0, 350, 60).fill('#008751'); // Green
    doc.rect(0, 20, 350, 20).fill('#ffffff'); // White
    
    // Coat of Arms placeholder
    doc.circle(175, 30, 15).fill('#ffffff');
    doc.fontSize(8).fillColor('#008751').text('NIGERIA', 160, 27);
    
    doc.fontSize(12).fillColor('#ffffff').text('NATIONAL IDENTITY MANAGEMENT COMMISSION', 0, 45, { align: 'center' });
  }

  private async addPremiumHeader(doc: any, colors: any): Promise<void> {
    // Premium gradient background
    const gradient = doc.linearGradient(0, 0, 350, 70);
    gradient.stop(0, colors.primary);
    gradient.stop(1, colors.gold);
    
    doc.rect(0, 0, 350, 70).fill(gradient);
    
    // Premium coat of arms effect
    doc.circle(175, 35, 18).fill('#ffffff');
    doc.fontSize(10).fillColor(colors.primary).text('⚡', 170, 30); // Lightning bolt for premium
    
    doc.fontSize(14).fillColor('#ffffff').text('PREMIUM IDENTITY SERVICES', 0, 55, { align: 'center' });
  }

  private async addExecutiveHeader(doc: any, colors: any): Promise<void> {
    // Executive sophisticated header
    doc.rect(0, 0, 350, 80).fill(colors.primary);
    
    // Executive seal
    doc.circle(175, 40, 20).fill(colors.gold);
    doc.circle(175, 40, 15).fill(colors.primary);
    doc.fontSize(12).fillColor(colors.gold).text('★', 170, 35);
    
    doc.fontSize(16).fillColor(colors.silver).text('EXECUTIVE IDENTITY COMMISSION', 0, 65, { align: 'center' });
    doc.fontSize(10).fillColor(colors.silver).text('CERTIFIED DOCUMENT', 0, 80, { align: 'center' });
  }

  private async addQuantumHeader(doc: any, colors: any): Promise<void> {
    // Quantum neural header
    const quantumGradient = doc.linearGradient(0, 0, 350, 80);
    quantumGradient.stop(0, colors.background);
    quantumGradient.stop(0.5, colors.quantum);
    quantumGradient.stop(1, colors.neural);
    
    doc.rect(0, 0, 350, 80).fill(quantumGradient);
    
    // Quantum neural network visualization
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 350;
      const y = Math.random() * 80;
      doc.circle(x, y, 2).fill(colors.neural + '80');
    }
    
    doc.fontSize(18).fillColor(colors.quantum).text('QUANTUM NEURAL CORE', 0, 60, { align: 'center' });
  }

  private addQuantumPattern(doc: any, colors: any): void {
    // Neural network pattern
    const nodes: { x: number; y: number; size: number }[] = [];
    for (let i = 0; i < 15; i++) {
      nodes.push({
        x: Math.random() * 300 + 25,
        y: Math.random() * 100 + 350,
        size: Math.random() * 3 + 1,
      });
    }

    // Draw connections
    doc.lineWidth(0.5).strokeColor(colors.neural + '40');
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.sqrt(
          Math.pow(nodes[i].x - nodes[j].x, 2) + Math.pow(nodes[i].y - nodes[j].y, 2)
        );
        if (distance < 80) {
          doc.moveTo(nodes[i].x, nodes[i].y).lineTo(nodes[j].x, nodes[j].y).stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach(node => {
      doc.circle(node.x, node.y, node.size).fill(colors.quantum);
    });
  }

  private async addQuantumDataViz(doc: any, data: NINData, colors: any, startY: number): Promise<void> {
    // Quantum data visualization
    const nameHash = this.hashString(`${data.firstName}${data.lastName}`);
    const dobHash = this.hashString(data.dateOfBirth);
    
    // Quantum consciousness meter
    doc.fontSize(8).fillColor(colors.neural).text('QUANTUM CONSCIOUSNESS', 20, startY);
    const consciousness = (nameHash % 100) / 100;
    
    // Consciousness bar
    doc.rect(20, startY + 15, 200, 8).fill(colors.background);
    doc.rect(20, startY + 15, 200 * consciousness, 8).fill(colors.quantum);
    doc.fontSize(8).fillColor(colors.neural).text(`${Math.round(consciousness * 100)}%`, 225, startY + 16);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private generateQuantumSignature(data: NINData): string {
    const signature = [
      this.hashString(data.nin).toString(16).substring(0, 8),
      this.hashString(data.firstName).toString(16).substring(0, 4),
      this.hashString(data.dateOfBirth).toString(16).substring(0, 4),
      this.hashString(Date.now().toString()).toString(16).substring(0, 4),
    ];
    return signature.join('-').toUpperCase();
  }

  getAvailableTemplates() {
    return [
      {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional NIN slip design with Nigerian government branding',
        price: 500,
        features: ['Basic security features', 'QR code', 'Government branding'],
        colors: this.premiumColors.classic,
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Enhanced design with gold accents and premium features',
        price: 1000,
        features: ['Enhanced security', 'Gold accents', 'Premium QR code', 'Professional layout'],
        colors: this.premiumColors.premium,
      },
      {
        id: 'executive',
        name: 'Executive',
        description: 'Sophisticated design for professional use',
        price: 1500,
        features: ['Executive certification', 'Advanced security', 'Premium materials', 'Certified document'],
        colors: this.premiumColors.executive,
      },
      {
        id: 'quantum',
        name: 'Quantum Neural',
        description: 'AI-powered design with quantum neural core integration',
        price: 2000,
        features: ['AI-powered design', 'Quantum consciousness', 'Neural signatures', 'Advanced AI features'],
        colors: this.premiumColors.quantum,
      },
    ];
  }
}