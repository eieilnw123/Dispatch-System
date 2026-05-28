import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 50 Major Logistics Locations in Thailand
const LOCATIONS = [
  // Ports
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal A', type: 'PORT_TERMINAL', lat: 13.0722, lng: 100.8937 },
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal B', type: 'PORT_TERMINAL', lat: 13.0750, lng: 100.8870 },
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal C', type: 'PORT_TERMINAL', lat: 13.0800, lng: 100.8900 },
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal D', type: 'PORT_TERMINAL', lat: 13.0850, lng: 100.8800 },
  { name: 'ท่าเรือกรุงเทพ (PAT) คลองเตย', type: 'PORT_TERMINAL', lat: 13.7027, lng: 100.5695 },
  { name: 'ท่าเรือ Kerry Siam Seaport', type: 'PORT_TERMINAL', lat: 13.1119, lng: 100.8931 },
  { name: 'ท่าเรือ สหไทยเทอร์มินัล (Sahathai)', type: 'PORT_TERMINAL', lat: 13.6231, lng: 100.5658 },
  { name: 'ท่าเรือ BMT Pacific (Phra Samut Chedi)', type: 'PORT_TERMINAL', lat: 13.5786, lng: 100.5842 },
  { name: 'ท่าเรือ BMTP (Bangkok)', type: 'PORT_TERMINAL', lat: 13.6741, lng: 100.5401 },
  
  // ICD Lat Krabang Modules
  { name: 'ICD ลาดกระบัง Module 1 (Eastern Sea Laem Chabang)', type: 'FULL_YARD', lat: 13.7431, lng: 100.7513 },
  { name: 'ICD ลาดกระบัง Module 2 (Evergreen)', type: 'FULL_YARD', lat: 13.7440, lng: 100.7520 },
  { name: 'ICD ลาดกระบัง Module 3 (OOCL)', type: 'FULL_YARD', lat: 13.7450, lng: 100.7530 },
  { name: 'ICD ลาดกระบัง Module 4 (Tiffa)', type: 'FULL_YARD', lat: 13.7460, lng: 100.7540 },
  { name: 'ICD ลาดกระบัง Module 5 (NYK)', type: 'FULL_YARD', lat: 13.7470, lng: 100.7550 },
  { name: 'ICD ลาดกระบัง Module 6 (Maersk)', type: 'FULL_YARD', lat: 13.7480, lng: 100.7560 },

  // Empty Depots (Bangna & Samut Prakan)
  { name: 'ลานตู้เปล่า NYK บางนา กม.18', type: 'EMPTY_YARD', lat: 13.6120, lng: 100.7450 },
  { name: 'ลานตู้เปล่า Evergreen สมุทรปราการ', type: 'EMPTY_YARD', lat: 13.5500, lng: 100.6500 },
  { name: 'ลานตู้เปล่า JWD แหลมฉบัง', type: 'EMPTY_YARD', lat: 13.0855, lng: 100.9100 },
  { name: 'ลานตู้เปล่า WICE Logistics แหลมฉบัง', type: 'EMPTY_YARD', lat: 13.0901, lng: 100.9050 },
  { name: 'ลานตู้เปล่า CMA CGM ลาดกระบัง', type: 'EMPTY_YARD', lat: 13.7500, lng: 100.7600 },
  { name: 'ลานตู้เปล่า MSC แหลมฉบัง', type: 'EMPTY_YARD', lat: 13.0820, lng: 100.8950 },
  { name: 'ลานตู้เปล่า Siam Shoreside (SSB) ลาดกระบัง', type: 'EMPTY_YARD', lat: 13.7410, lng: 100.7400 },
  { name: 'ลานตู้เปล่า E-Square บางนา กม.19', type: 'EMPTY_YARD', lat: 13.6100, lng: 100.7500 },
  { name: 'ลานตู้เปล่า Thai Connectivity Terminal (TCT)', type: 'EMPTY_YARD', lat: 13.6200, lng: 100.5600 },
  { name: 'ลานตู้เปล่า ONE (Ocean Network Express) ชลบุรี', type: 'EMPTY_YARD', lat: 13.3500, lng: 100.9800 },
  { name: 'ลานตู้เปล่า Hapag-Lloyd แหลมฉบัง', type: 'EMPTY_YARD', lat: 13.0880, lng: 100.8880 },
  { name: 'ลานพักตู้หนัก T-PARK แหลมฉบัง', type: 'FULL_YARD', lat: 13.0900, lng: 100.9200 },
  { name: 'ลานจอดรถหัวลาก (บริษัท)', type: 'EMPTY_YARD', lat: 13.6000, lng: 100.7500 },

  // Industrial Estates & Factories
  { name: 'นิคมอุตสาหกรรมอมตะนคร (Amata City Chonburi)', type: 'FACTORY', lat: 13.4182, lng: 101.0134 },
  { name: 'นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด (Eastern Seaboard)', type: 'FACTORY', lat: 13.0238, lng: 101.1274 },
  { name: 'นิคมอุตสาหกรรมเหมราช ระยอง (WHA Rayong)', type: 'FACTORY', lat: 12.8580, lng: 101.2160 },
  { name: 'นิคมอุตสาหกรรมปิ่นทอง ชลบุรี', type: 'FACTORY', lat: 13.1110, lng: 101.0200 },
  { name: 'นิคมอุตสาหกรรมโรจนะ อยุธยา', type: 'FACTORY', lat: 14.3000, lng: 100.6500 },
  { name: 'นิคมอุตสาหกรรมนวนคร ปทุมธานี', type: 'FACTORY', lat: 14.1200, lng: 100.6100 },
  { name: 'นิคมอุตสาหกรรมบางปู สมุทรปราการ', type: 'FACTORY', lat: 13.5200, lng: 100.6400 },
  { name: 'นิคมอุตสาหกรรมเวลโกรว์ ฉะเชิงเทรา', type: 'FACTORY', lat: 13.5600, lng: 100.9600 },
  { name: 'นิคมอุตสาหกรรมเกตเวย์ ซิตี้ ฉะเชิงเทรา', type: 'FACTORY', lat: 13.6800, lng: 101.2500 },
  { name: 'โรงงาน ฟอร์ด ระยอง (Ford Motor)', type: 'FACTORY', lat: 12.9814, lng: 101.1287 },
  { name: 'โรงงาน มิตซูบิชิ มอเตอร์ส แหลมฉบัง', type: 'FACTORY', lat: 13.0783, lng: 100.9161 },
  { name: 'โรงงาน โตโยต้า บ้าบโพธิ์ ฉะเชิงเทรา', type: 'FACTORY', lat: 13.5833, lng: 101.0167 },
  { name: 'โรงงาน ฮอนด้า ปราจีนบุรี', type: 'FACTORY', lat: 13.9110, lng: 101.5590 },
  { name: 'โรงงาน โซนี่ ชลบุรี', type: 'FACTORY', lat: 13.4079, lng: 100.9995 },
  { name: 'โรงงาน ไดกิ้น อินดัสทรีส์ ชลบุรี', type: 'FACTORY', lat: 13.3500, lng: 100.9800 },
  { name: 'โรงงาน ซัมซุง ศรีราชา', type: 'FACTORY', lat: 13.1500, lng: 100.9500 },
  { name: 'ศูนย์กระจายสินค้า 7-11 บางบัวทอง', type: 'FACTORY', lat: 13.9500, lng: 100.4100 },
  { name: 'ศูนย์กระจายสินค้า Lotus วังน้อย', type: 'FACTORY', lat: 14.2200, lng: 100.7100 }
]

const CUSTOMERS = [
  'บริษัท มิตซุย-โซโค (ประเทศไทย) จำกัด',
  'Kerry Logistics (Thailand)',
  'K Line Logistics',
  'Yusen Logistics (Thailand)',
  'Schenker (Thai) Ltd.',
  'DHL Global Forwarding (Thailand)'
]

async function main() {
  console.log('Clearing ALL data...')
  await prisma.jobLeg.deleteMany()
  await prisma.job.deleteMany()
  await prisma.yardSlot.deleteMany()
  await prisma.location.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.truck.deleteMany()
  await prisma.customer.deleteMany()

  console.log('Creating Customers...')
  await Promise.all(CUSTOMERS.map(c => prisma.customer.create({ data: { name: c } })))

  console.log(`Creating ${LOCATIONS.length} Locations...`)
  await Promise.all(LOCATIONS.map(l => prisma.location.create({ 
    data: { name: l.name, type: l.type as any, latitude: l.lat, longitude: l.lng } 
  })))

  console.log('Seed Master Data complete! Database is fresh.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
