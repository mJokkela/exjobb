import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { SparePart, AppSettings, HistoryEntry, FieldHistoryEntry } from './types.ts';
import dotenv from 'dotenv';
import { Request } from 'express';
import type { S3File } from './s3';
dotenv.config();


// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'postgres',
//   password: 'admin',
//   port: 5432,
// });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // krävs av Railway
  },
});


const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}





export const dbOperations = {
  getAllParts: async (): Promise<SparePart[]> => {
    const res = await pool.query('SELECT * FROM spare_parts');
    return res.rows.map(row => ({
      internalArticleNumber: row.internal_article_number,
      supplierArticleNumber: row.supplier_article_number,
      name: row.name,
      type: row.type,
      department: row.department,
      roomSection: row.room_section,
      machineNumber: row.machine_number,
      dimensions: {
        length: row.dimensions_length,
        height: row.dimensions_height,
        width: row.dimensions_width,
      },
      weight: row.weight,
      manufacturer: row.manufacturer,
      supplier: row.supplier,
      supplierOrgId: row.supplier_org_id,
      price: row.price,
      location: row.location,
      building: row.building,
      storageRack: row.storage_rack,
      shelfLevel: row.shelf_level,
      quantity: row.quantity,
      date: row.date,
      storagePriority: row.storage_priority,
      addedBy: row.added_by,
      ordererName: row.orderer_name,
      imageUrl: row.image_url,
      comment: row.comment
    }));
  },

  getSettings: async (): Promise<AppSettings> => {
    const res = await pool.query('SELECT * FROM app_settings LIMIT 1');
    const row = res.rows[0];
    return {
      logoUrl: row?.logo_url || '/logo.png'
    };
  },

  updateSettings: async (settings: AppSettings) => {
    await pool.query(
      `INSERT INTO app_settings (id, logo_url, updated_at)
       VALUES (1, $1, $2)
       ON CONFLICT (id) DO UPDATE SET
       logo_url = EXCLUDED.logo_url,
       updated_at = EXCLUDED.updated_at`,
      [settings.logoUrl, new Date().toISOString()]
    );
  },


  //----------------------------------------------------------
  //ladda upp lokalt
  // uploadImage: async (file: Express.Multer.File, articleNumber: string): Promise<string> => {
  //   if (file.size > 5 * 1024 * 1024) {
  //     throw new Error('Bilden får inte vara större än 5MB');
  //   }

  //   const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  //   if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
  //     throw new Error('Endast JPG, PNG och GIF-filer är tillåtna');
  //   }

  //   const ext = path.extname(file.originalname);
  //   const cleanArticleNumber = articleNumber.replace(/[^a-zA-Z0-9-_]/g, '');
  //   const fileName = `${cleanArticleNumber}-${uuidv4()}${ext}`;
  //   const uploadsDir = path.join(__dirname, '../uploads');
  //   const filePath = path.join(uploadsDir, fileName); // Bilden sparas här

  //   if (!fs.existsSync(uploadsDir)) {
  //     fs.mkdirSync(uploadsDir, { recursive: true });
  //   }
    

  //   fs.writeFileSync(filePath, file.buffer);
  //   return `/uploads/${fileName}`; // detta sparas i databasen och används i frontend
  // },
  //----------------------------------------------------------

  

  //ladda upp till S3 file: Express.MulterS3.File
  uploadImage: async (file: S3File): Promise<string> => {
  // Typkontroll: maxstorlek och filtyp (kan återanvända gammal kod om så vill)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Bilden får inte vara större än 5MB');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.mimetype.toLowerCase())) {
    throw new Error('Endast JPG, PNG och GIF-filer är tillåtna');
  }

  console.log('🔁 Multer S3 file object:', file);
  // Multer-s3 har redan laddat upp till S3 – vi returnerar URL:en
  return file.location;
},

  insertPart: async (part: SparePart) => {
    console.log('Ska spara reservdel i DB:', part);

    await pool.query(`
      INSERT INTO spare_parts (
        internal_article_number, supplier_article_number, name, type, department,
        room_section, machine_number, dimensions_length, dimensions_height, dimensions_width,
        weight, manufacturer, supplier, supplier_org_id, price, location, building,
        storage_rack, shelf_level, quantity, date, storage_priority, added_by,
        orderer_name, image_url, comment, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23,
        $24, $25, $26, $27
      )
      ON CONFLICT (internal_article_number) DO UPDATE SET
        supplier_article_number = EXCLUDED.supplier_article_number,
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        department = EXCLUDED.department,
        room_section = EXCLUDED.room_section,
        machine_number = EXCLUDED.machine_number,
        dimensions_length = EXCLUDED.dimensions_length,
        dimensions_height = EXCLUDED.dimensions_height,
        dimensions_width = EXCLUDED.dimensions_width,
        weight = EXCLUDED.weight,
        manufacturer = EXCLUDED.manufacturer,
        supplier = EXCLUDED.supplier,
        supplier_org_id = EXCLUDED.supplier_org_id,
        price = EXCLUDED.price,
        location = EXCLUDED.location,
        building = EXCLUDED.building,
        storage_rack = EXCLUDED.storage_rack,
        shelf_level = EXCLUDED.shelf_level,
        quantity = EXCLUDED.quantity,
        date = EXCLUDED.date,
        storage_priority = EXCLUDED.storage_priority,
        added_by = EXCLUDED.added_by,
        orderer_name = EXCLUDED.orderer_name,
        image_url = EXCLUDED.image_url,
        comment = EXCLUDED.comment,
        updated_at = EXCLUDED.updated_at 
     `,[
      part.internalArticleNumber,
      part.supplierArticleNumber,
      part.name,
      part.type,
      part.department,
      part.roomSection,
      part.machineNumber,
      part.dimensions.length,
      part.dimensions.height,
      part.dimensions.width,
      part.weight,
      part.manufacturer,
      part.supplier,
      part.supplierOrgId,
      part.price,
      part.location,
      part.building,
      part.storageRack,
      part.shelfLevel,
      part.quantity,
      part.date,
      part.storagePriority,
      part.addedBy,
      part.ordererName,
      part.imageUrl,
      part.comment,
      new Date().toISOString()
    ]);

    //logga direkt efter sparad reservdel
    await dbOperations.insertPartHistory(
      part.internalArticleNumber,
      part.quantity,
      0,
      part.quantity,
      part.addedBy ? `Användare ${part.addedBy}` : 'System',
      part.comment || 'Ingen kommentar'
    );
    
    
  },

  importParts: async (parts: SparePart[]) => {
    for (const part of parts) {
      await dbOperations.insertPart(part);
    }
  },

  updateQuantity: async (articleNumber: string, newQty: number, performedBy: string, comment: string): Promise<void> => {
    // 1. Hämta nuvarande saldo först
    const res = await pool.query(
      'SELECT quantity FROM spare_parts WHERE internal_article_number = $1',
      [articleNumber]
    );
    const oldQty = res.rows[0]?.quantity ?? 0;
  
    // 2. Uppdatera saldo
    await pool.query(
      'UPDATE spare_parts SET quantity = $1 WHERE internal_article_number = $2',
      [newQty, articleNumber]
    );
  
    // 3. Logga i historik
    await dbOperations.insertPartHistory(
      articleNumber,
      newQty,
      oldQty,
      newQty,
      performedBy,
      comment,
      // 'System',              // performedBy
      // 'Updated quantity through form' // comment
    );
    
    
  },  

  // getFieldHistory: async (articleNumber: string): Promise<FieldHistoryEntry[]> => {
  //   const res = await pool.query(
  //     'SELECT * FROM spare_parts_field_history WHERE part_number = $1 ORDER BY created_at DESC',
  //     [articleNumber]
  //   );
  //   return res.rows.map(row => ({
  //     id:          row.id,
  //     partNumber:  row.part_number,
  //     fieldName:   row.field_name,
  //     oldValue:    row.old_value,
  //     newValue:    row.new_value,
  //     performedBy: row.performed_by,
  //     createdAt:   row.created_at.toISOString()
  //   }));
  // },
  
  getPartHistory: async (articleNumber: string): Promise<HistoryEntry[]> => {
    const res = await pool.query(
      'SELECT * FROM spare_parts_history WHERE part_number = $1 ORDER BY created_at DESC',
      [articleNumber]
    );
    return res.rows.map(row => ({
      id:               row.id,
      partNumber:       row.part_number,
      actionType:       row.action_type as 'WITHDRAWAL' | 'ADDITION',
      quantity:         row.quantity,
      previousQuantity: row.previous_quantity,
      newQuantity:      row.new_quantity,
      performedBy:      row.performed_by,
      comment:          row.comment ?? undefined,
      createdAt:        row.created_at.toISOString()
    }));
  },
  

  insertPartHistory: async (articleNumber: string, quantity: number, oldQty: number, newQty: number, performedBy: string = 'System', comment: string = 'Ingen kommentar'): Promise<void> => {

    const actionType = newQty < oldQty ? 'WITHDRAWAL' : 'ADDITION';

    console.log(
      `⚙️ insertPartHistory called for ${articleNumber}:`,
      { actionType, oldQty, newQty, performedBy, comment }
    );

    await pool.query(
    `INSERT INTO spare_parts_history
      (part_number, action_type, quantity, previous_quantity, new_quantity, performed_by, comment, created_at)
     VALUES 
      ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [
      articleNumber,  // $1
      actionType,     // $2  (WITHDRAWAL eller ADDITION)
      oldQty,         // $3  quantity = saldot innan
      oldQty,         // $4  previous_quantity
      newQty,         // $5  new_quantity
      performedBy,    // $6
      comment         // $7
    ]
  );
  },
  
  
  // insertFieldHistory: async (articleNumber: string, fieldName: string, oldValue: string, newValue: string, performedBy: string = 'System'): Promise<void> => {
  //   await pool.query(
  //     `INSERT INTO spare_parts_field_history (part_number, field_name, old_value, new_value, created_at)
  //      VALUES ($1, $2, $3, $4, NOW())`,
  //     [articleNumber, fieldName, oldValue, newValue, performedBy]
  //   );
  // },

  deleteImage: async (imageUrl: string): Promise<void> => {
    try {
      const fileName = path.basename(imageUrl);
      const filePath = path.join(uploadsDir, fileName);
  
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      } else {
        console.warn(`Filen ${fileName} kunde inte hittas`);
      }
    } catch (error) {
      console.error('Fel vid borttagning av bild:', error);
      throw new Error('Kunde inte ta bort bilden');
    }
  },
  
  deletePart: async (articleNumber: string): Promise<void> => {
    await pool.query(
      'DELETE FROM spare_parts WHERE internal_article_number = $1',
      [articleNumber]
    );
  },
  
  
  
};
