// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Realistic locations in Thailand
const LOCATIONS = [
  { name: 'ICD ลาดกระบัง', type: 'EMPTY_YARD', lat: 13.7431, lng: 100.7513 },
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal A', type: 'PORT_TERMINAL', lat: 13.0722, lng: 100.8937 },
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal B', type: 'PORT_TERMINAL', lat: 13.0750, lng: 100.8870 },
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal C', type: 'PORT_TERMINAL', lat: 13.0800, lng: 100.8900 },
  { name: 'ท่าเรือแหลมฉบัง (LCH) Terminal D', type: 'PORT_TERMINAL', lat: 13.0850, lng: 100.8800 },
  { name: 'ท่าเรือกรุงเทพ (PAT)', type: 'PORT_TERMINAL', lat: 13.7027, lng: 100.5695 },
  { name: 'โรงงานโซนี่ ชลบุรี', type: 'FACTORY', lat: 13.4079, lng: 100.9995 },
  { name: 'นิคมอุตสาหกรรมอมตะนคร', type: 'FACTORY', lat: 13.4182, lng: 101.0134 },
  { name: 'นิคมอุตสาหกรรมอีสเทิร์นซีบอร์ด', type: 'FACTORY', lat: 13.0238, lng: 101.1274 },
  { name: 'โรงงานฟอร์ด ระยอง', type: 'FACTORY', lat: 12.9814, lng: 101.1287 },
  { name: 'โรงงานมิตซูบิชิ แหลมฉบัง', type: 'FACTORY', lat: 13.0783, lng: 100.9161 },
  { name: 'ลานตู้เปล่า NYK บางนา', type: 'EMPTY_YARD', lat: 13.6300, lng: 100.7000 },
  { name: 'ลานตู้เปล่า Evergreen สมุทรปราการ', type: 'EMPTY_YARD', lat: 13.5500, lng: 100.6500 },
  { name: 'ลานตู้หนัก T-PARK', type: 'FULL_YARD', lat: 13.5550, lng: 100.9950 },
  { name: 'โรงงานฮอนด้า ปราจีนบุรี', type: 'FACTORY', lat: 13.9110, lng: 101.5590 },
  { name: 'นิคมอุตสาหกรรมเหมราช ระยอง', type: 'FACTORY', lat: 12.8580, lng: 101.2160 },
  { name: 'ลานตู้ CMA ลาดกระบัง', type: 'EMPTY_YARD', lat: 13.7500, lng: 100.7600 },
  { name: 'โรงงานไดกิ้น ชลบุรี', type: 'FACTORY', lat: 13.3500, lng: 100.9800 },
  { name: 'ลานพักตู้ โอนย้ายชลบุรี', type: 'FULL_YARD', lat: 13.3000, lng: 100.9500 },
  { name: 'ลานจอดรถหัวลาก (บริษัท)', type: 'EMPTY_YARD', lat: 13.6000, lng: 100.7500 },
]

const DRIVERS = [
  'นาย สมชาย ใจเพชร', 'นาย สุชาติ เร็วดี', 'นาย อดุลย์ ทางเรียบ', 'นาย วิชาญ ชำนาญขับ',
  'นาย มนัส ตรงเวลา', 'นาย พงษ์ศักดิ์ รักษารถ', 'นาย เดชา ยิ้มแย้ม', 'นาย เกียรติ นิ่งสงบ',
  'นาย ศุภชัย วิ่งไว', 'นาย ณัฐวุฒิ ทางไกล'
]

const CUSTOMERS = [
  'บริษัท มิตซุย-โซโค (ประเทศไทย) จำกัด',
  'Kerry Logistics (Thailand)',
  'K Line Logistics',
  'Yusen Logistics (Thailand)',
  'Schenker (Thai) Ltd.'
]

const PLATES = ['70-1234', '71-9876', '72-5555', '73-4321', '70-9999', '71-1111', '72-2222', '73-3333', '70-4444', '71-5555']

async function main() {
  console.log('Clearing database...')
  await prisma.jobLeg.deleteMany()
  await prisma.job.deleteMany()
  await prisma.yardSlot.deleteMany()
  await prisma.location.deleteMany()
  await prisma.driver.deleteMany()
  await prisma.truck.deleteMany()
  await prisma.customer.deleteMany()

  console.log('Creating Customers...')
  const dbCustomers = await Promise.all(CUSTOMERS.map(c => prisma.customer.create({ data: { name: c } })))

  console.log('Creating Trucks...')
  const dbTrucks = await Promise.all(PLATES.map(p => prisma.truck.create({ data: { plateNumber: p, truckType: 'หัวลาก 10 ล้อ' } })))

  console.log('Creating Drivers...')
  const dbDrivers = await Promise.all(DRIVERS.map(d => prisma.driver.create({ data: { name: d, phone: '08' + Math.floor(10000000 + Math.random() * 90000000) } })))

  console.log('Creating Locations...')
  const dbLocations = await Promise.all(LOCATIONS.map(l => prisma.location.create({ 
    data: { name: l.name, type: l.type as any, latitude: l.lat, longitude: l.lng } 
  })))

  // Separate locations by type for realistic routing
  const emptyYards = dbLocations.filter(l => l.type === 'EMPTY_YARD')
  const factories = dbLocations.filter(l => l.type === 'FACTORY')
  const ports = dbLocations.filter(l => l.type === 'PORT_TERMINAL')

  console.log('Simulating Jobs for 7 days...')
  // From 2 days ago to 4 days in future
  const now = new Date()
  
  for (let offset = -2; offset <= 4; offset++) {
    const jobDate = new Date(now)
    jobDate.setDate(now.getDate() + offset)
    
    // Create 8-12 jobs per day
    const numJobs = Math.floor(Math.random() * 5) + 8
    
    for (let i = 0; i < numJobs; i++) {
      // Pick random customer
      const cust = dbCustomers[Math.floor(Math.random() * dbCustomers.length)]
      
      // Random Job Type: Import (Port -> Factory) or Export (Empty Yard -> Factory -> Port)
      const isExport = Math.random() > 0.5
      
      const containerSize = Math.random() > 0.5 ? 'FT_20' : 'FT_40'
      const vgm = (Math.random() * 20 + 5).toFixed(1) // 5 to 25 tons
      
      const cutoff = new Date(jobDate)
      cutoff.setHours(17 + Math.floor(Math.random() * 5), 0, 0, 0) // Cutoff between 17:00 and 22:00

      // Overall Job Status based on date
      let jobStatus = 'PENDING'
      if (offset < 0) jobStatus = 'COMPLETED'
      else if (offset === 0) jobStatus = Math.random() > 0.5 ? 'COMPLETED' : 'IN_PROGRESS'
      
      // Determine Legs
      const legsData = []
      const driver = dbDrivers[Math.floor(Math.random() * dbDrivers.length)]
      const truck = dbTrucks[Math.floor(Math.random() * dbTrucks.length)]

      if (isExport) {
        // Leg 1: Empty Yard to Factory
        const yard = emptyYards[Math.floor(Math.random() * emptyYards.length)]
        const factory = factories[Math.floor(Math.random() * factories.length)]
        legsData.push({
          sequenceOrder: 1,
          originId: yard.id,
          destinationId: factory.id,
          driverId: driver.id,
          truckId: truck.id,
          distanceKm: 50,
          estimatedHours: 1.5,
          status: jobStatus === 'COMPLETED' ? 'COMPLETED' : (jobStatus === 'IN_PROGRESS' ? 'ARRIVED' : 'PENDING')
        })
        
        // Leg 2: Factory to Port
        const port = ports[Math.floor(Math.random() * ports.length)]
        legsData.push({
          sequenceOrder: 2,
          originId: factory.id,
          destinationId: port.id,
          driverId: driver.id,
          truckId: truck.id,
          distanceKm: 80,
          estimatedHours: 2.0,
          status: jobStatus === 'COMPLETED' ? 'COMPLETED' : 'PENDING' // Leg 2 is usually pending if Leg 1 is in progress
        })
      } else {
        // Import: Port to Factory
        const port = ports[Math.floor(Math.random() * ports.length)]
        const factory = factories[Math.floor(Math.random() * factories.length)]
        legsData.push({
          sequenceOrder: 1,
          originId: port.id,
          destinationId: factory.id,
          driverId: driver.id,
          truckId: truck.id,
          distanceKm: 120,
          estimatedHours: 3.0,
          status: jobStatus === 'COMPLETED' ? 'COMPLETED' : (jobStatus === 'IN_PROGRESS' ? 'IN_TRANSIT' : 'PENDING')
        })
      }

      await prisma.job.create({
        data: {
          date: jobDate,
          customerId: cust.id,
          containerSize: containerSize as any,
          codeRef: `JOB-${jobDate.getFullYear()}${(jobDate.getMonth()+1).toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
          vgm: parseFloat(vgm),
          cutOffTime: cutoff,
          status: jobStatus as any,
          legs: {
            create: legsData
          }
        }
      })
    }
  }

  console.log('Simulation complete! Enjoy the test drive.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
