import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { CrawlResult, Vehicle } from '../types';

export class MercedesCrawler {
  private browser: any = null;

  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawlVehicle(url: string): Promise<CrawlResult> {
    try {
      await this.init();
      const page = await this.browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Wait for the page to load completely
      await page.waitForTimeout(3000);

      const vehicleData = await page.evaluate(() => {
        const data: any = {};

        // Helper function to get text content safely
        const getText = (selector: string): string => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || '';
        };

        // Helper function to get attribute safely
        const getAttribute = (selector: string, attr: string): string => {
          const element = document.querySelector(selector);
          return element?.getAttribute(attr) || '';
        };

        // Extract basic vehicle information
        data.model = getText('h1.vehicle-title, .vehicle-name, .title-vehicle');
        data.price = getText('.price-value, .vehicle-price, .price');
        data.vehicleNumber = getText('.vehicle-id, .stock-number, .fahrzeugnummer');
        
        // Extract specifications
        const specs: { [key: string]: string } = {};
        document.querySelectorAll('.spec-item, .vehicle-spec, .specification-item').forEach((item: Element) => {
          const label = item.querySelector('.spec-label, .label')?.textContent?.trim();
          const value = item.querySelector('.spec-value, .value')?.textContent?.trim();
          if (label && value) {
            specs[label.toLowerCase()] = value;
          }
        });

        // Map common specifications
        data.vehicleType = specs['fahrzeugart'] || specs['vehicle type'] || '';
        data.firstRegistration = specs['erstzulassung'] || specs['first registration'] || '';
        data.modelYear = specs['modelljahr'] || specs['model year'] || '';
        data.mileage = specs['laufleistung'] || specs['mileage'] || '';
        data.power = specs['leistung'] || specs['power'] || '';
        data.fuelType = specs['kraftstoffart'] || specs['fuel type'] || '';
        data.transmission = specs['getriebe'] || specs['transmission'] || '';
        data.exteriorColor = specs['außenfarbe'] || specs['exterior color'] || '';
        data.interiorColor = specs['innenfarbe'] || specs['interior color'] || '';
        data.upholstery = specs['polster'] || specs['upholstery'] || '';
        data.acceleration = specs['beschleunigung'] || specs['acceleration'] || '';
        data.warranty = specs['garantie'] || specs['warranty'] || '';
        data.chargingDuration = specs['ladezeit'] || specs['charging time'] || '';
        data.electricRange = specs['reichweite'] || specs['range'] || '';
        data.energy = specs['energieverbrauch'] || specs['energy consumption'] || '';

        // Extract dealer location
        data.dealerLocation = getText('.dealer-location, .standort, .location');

        // Extract images
        const images: string[] = [];
        document.querySelectorAll('img[src*="vehicle"], img[src*="mercedes"], .gallery img, .vehicle-images img').forEach((img: Element) => {
          const src = img.getAttribute('src');
          if (src && !src.includes('placeholder') && !src.includes('loading')) {
            images.push(src.startsWith('http') ? src : 'https://gebrauchtwagen.mercedes-benz.de' + src);
          }
        });
        data.images = images;

        // Extract main image
        const mainImg = document.querySelector('.main-image img, .hero-image img, .primary-image img');
        if (mainImg) {
          const src = mainImg.getAttribute('src');
          data.mainImage = src?.startsWith('http') ? src : 'https://gebrauchtwagen.mercedes-benz.de' + src;
        }

        // Extract detailed features
        const extractFeatures = (containerSelector: string): string[] => {
          const features: string[] = [];
          const container = document.querySelector(containerSelector);
          if (container) {
            container.querySelectorAll('li, .feature-item, .equipment-item').forEach((item: Element) => {
              const text = item.textContent?.trim();
              if (text) features.push(text);
            });
          }
          return features;
        };

        data.interior = extractFeatures('.interior-features, .interieur');
        data.exterior = extractFeatures('.exterior-features, .exterieur');
        data.infotainment = extractFeatures('.infotainment-features, .infotainment');
        data.safetyTech = extractFeatures('.safety-features, .sicherheit');
        data.packages = extractFeatures('.package-features, .pakete');

        return data;
      });

      await page.close();

      // Download and save images
      const imageGallery = await this.downloadImages(vehicleData.images || []);
      const mainImage = vehicleData.mainImage ? await this.downloadImage(vehicleData.mainImage) : undefined;

      // Clean and format the data
      const vehicle: Partial<Vehicle> = {
        mercedesUrl: url,
        mainImage,
        imageGallery,
        model: vehicleData.model || 'Unknown Model',
        price: this.parsePrice(vehicleData.price),
        vehicleNumber: vehicleData.vehicleNumber || '',
        vehicleType: vehicleData.vehicleType || '',
        firstRegistration: vehicleData.firstRegistration || '',
        modelYear: this.parseYear(vehicleData.modelYear),
        mileage: this.parseMileage(vehicleData.mileage),
        power: vehicleData.power || '',
        fuelType: vehicleData.fuelType || '',
        transmission: vehicleData.transmission || '',
        exteriorColor: vehicleData.exteriorColor || '',
        interiorColor: vehicleData.interiorColor || '',
        upholstery: vehicleData.upholstery || '',
        acceleration: vehicleData.acceleration || '',
        warranty: vehicleData.warranty || '',
        chargingDuration: vehicleData.chargingDuration || '',
        electricRange: vehicleData.electricRange || '',
        energy: vehicleData.energy || '',
        dealerLocation: vehicleData.dealerLocation || '',
        interior: vehicleData.interior || [],
        exterior: vehicleData.exterior || [],
        infotainment: vehicleData.infotainment || [],
        safetyTech: vehicleData.safetyTech || [],
        packages: vehicleData.packages || []
      };

      return {
        success: true,
        vehicle
      };

    } catch (error) {
      console.error('Crawling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async downloadImages(imageUrls: string[]): Promise<string[]> {
    const downloadedImages: string[] = [];
    
    for (const url of imageUrls.slice(0, 10)) { // Limit to 10 images
      try {
        const imagePath = await this.downloadImage(url);
        if (imagePath) {
          downloadedImages.push(imagePath);
        }
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    }

    return downloadedImages;
  }

  private async downloadImage(url: string): Promise<string | undefined> {
    try {
      const response = await axios.get(url, { 
        responseType: 'stream',
        timeout: 10000
      });

      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const filePath = path.join(uploadsDir, fileName);

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(`/uploads/${fileName}`));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      return undefined;
    }
  }

  private parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    const cleanPrice = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleanPrice) || 0;
  }

  private parseYear(yearStr: string): number {
    if (!yearStr) return new Date().getFullYear();
    const year = parseInt(yearStr);
    return isNaN(year) ? new Date().getFullYear() : year;
  }

  private parseMileage(mileageStr: string): number {
    if (!mileageStr) return 0;
    const cleanMileage = mileageStr.replace(/[^\d]/g, '');
    return parseInt(cleanMileage) || 0;
  }
}

export const mercedesCrawler = new MercedesCrawler();