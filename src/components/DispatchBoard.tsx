"use client";

import React, { useState, useEffect, useTransition } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Truck, MapPin, ArrowRight, UserPlus, Map, PlusCircle, Moon, Sun, Trash2, CalendarHeart } from "lucide-react";
import { 
  createCustomer, createLocation, createDriver, createJob,
  deleteCustomer, deleteLocation, deleteDriver, deleteJob,
  updateLegStatus, updateJobStatus, injectTransfer, updateLegDriver
} from "@/app/actions";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export default function DispatchBoard({ initialJobs, customers, locations, drivers, selectedDate }: any) {
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modal States
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showDriverStatus, setShowDriverStatus] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  
  // Inject Transfer Modal State
  const [transferJobId, setTransferJobId] = useState<string | null>(null);
  const [transferLegs, setTransferLegs] = useState<any[]>([]);

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id);

  const isCutOffApproaching = (cutOff: string, status: string) => {
    if (!cutOff || status === "COMPLETED" || status === "CANCELLED") return false;
    const cutOffDate = new Date(cutOff).getTime();
    const now = new Date().getTime();
    const hoursLeft = (cutOffDate - now) / (1000 * 60 * 60);
    // เตือนถ้าเหลือน้อยกว่าหรือเท่ากับ 3 ชั่วโมง (รวมถึงถ้าติดลบ คือเลยเวลา Cut-off ไปแล้ว)
    return hoursLeft <= 3;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300';
      case 'IN_TRANSIT': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ARRIVED': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // Helper to render driver options with warning if busy
  const renderDriverOptions = () => {
    return drivers.map((d: any) => {
      const isBusy = d.legs && d.legs.length > 0;
      let label = d.name;
      if (isBusy) {
        const activeLeg = d.legs[0];
        label += ` ⚠️ (ติดงาน: ${activeLeg.origin?.name} ➔ ${activeLeg.destination?.name})`;
      }
      return <option key={d.id} value={d.id}>{label}</option>;
    });
  };

  return (
    <div className="p-4 md:p-6 bg-slate-100 dark:bg-slate-900 min-h-screen text-black dark:text-white transition-colors duration-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-3xl font-extrabold text-black dark:text-white flex items-center">
          ระบบจัดงานรถ
          <input 
             type="date" 
             value={selectedDate || ""} 
             onChange={(e) => router.push(`/?date=${e.target.value}`)} 
             className="ml-4 text-sm md:text-base font-bold p-2 border-2 border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-black dark:text-white cursor-pointer hover:border-blue-500 transition-colors"
             title="เลือกวันที่เพื่อดูงาน"
          />
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="ml-4 p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
              title="สลับโหมดกลางคืน/ปกติ"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
          )}
        </h1>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => setShowDriverStatus(true)} className="flex-1 md:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded shadow flex items-center">
            <CalendarHeart className="w-4 h-4 mr-1" /> สถานะคนรถ
          </button>
          <button onClick={() => setShowAddCustomer(true)} className="flex-1 md:flex-none justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-bold px-3 py-2 rounded shadow hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
            <UserPlus className="w-4 h-4 mr-1" /> ลูกค้า
          </button>
          <button onClick={() => setShowAddLocation(true)} className="flex-1 md:flex-none justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-bold px-3 py-2 rounded shadow hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
            <Map className="w-4 h-4 mr-1" /> สถานที่
          </button>
          <button onClick={() => setShowAddDriver(true)} className="flex-1 md:flex-none justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-black dark:text-white font-bold px-3 py-2 rounded shadow hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center">
            <Truck className="w-4 h-4 mr-1" /> คนขับ
          </button>
          <button onClick={() => setShowCreateJob(true)} className="w-full md:w-auto justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center font-bold">
            <PlusCircle className="w-4 h-4 mr-1" /> สร้างงานใหม่
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
            <thead className="bg-slate-800 dark:bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-bold">วันที่</th>
                <th className="px-4 py-3 text-left font-bold">คนขับ (งานแรก)</th>
                <th className="px-4 py-3 text-left font-bold">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-bold">ขนาดตู้</th>
                <th className="px-4 py-3 text-left font-bold">รหัสงาน / อินวอยซ์</th>
                <th className="px-4 py-3 text-left font-bold">น้ำหนัก (VGM)</th>
                <th className="px-4 py-3 text-left font-bold">เวลา Cut-off</th>
                <th className="px-4 py-3 text-left font-bold">สถานะงานรวม</th>
                <th className="px-4 py-3 text-center font-bold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {initialJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 font-bold text-slate-500 dark:text-slate-400">ยังไม่มีข้อมูลงานในระบบ กรุณาสร้างงานใหม่</td>
                </tr>
              ) : initialJobs.map((job: any) => {
                const warning = isCutOffApproaching(job.cutOffTime, job.status);
                const isExpanded = expandedRow === job.id;
                
                const primaryDriverName = job.legs[0]?.driver?.name || "ยังไม่ระบุ";
                const primaryTruckPlate = job.legs[0]?.truck?.plateNumber || "-";

                return (
                  <React.Fragment key={job.id}>
                    <tr 
                      className={`transition-colors ${warning ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-black dark:text-white font-extrabold cursor-pointer" onClick={() => toggleRow(job.id)}>
                        {new Date(job.date).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => toggleRow(job.id)}>
                        <div className="font-extrabold text-black dark:text-white text-base">{primaryDriverName}</div>
                        <div className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{primaryTruckPlate}</div>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-black dark:text-white cursor-pointer" onClick={() => toggleRow(job.id)}>{job.customer?.name}</td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => toggleRow(job.id)}>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full text-xs font-black border border-blue-300 dark:border-blue-700">
                          {job.containerSize.replace('FT_', '')} FT
                        </span>
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => toggleRow(job.id)}>
                        <div className="font-extrabold text-black dark:text-white">{job.codeRef || "-"}</div>
                        <div className="text-slate-700 dark:text-slate-300 font-semibold text-sm">{job.invoiceRef || "-"}</div>
                      </td>
                      <td className="px-4 py-3 font-extrabold text-black dark:text-white cursor-pointer" onClick={() => toggleRow(job.id)}>{job.vgm ? job.vgm + " ตัน" : "-"}</td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => toggleRow(job.id)}>
                        <div className="flex items-center space-x-1">
                          {warning && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                          <span className={warning ? 'text-red-700 dark:text-red-400 font-black' : 'text-black dark:text-white font-extrabold'}>
                            {job.cutOffTime ? new Date(job.cutOffTime).toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'}) : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={job.status}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            startTransition(async () => {
                              await updateJobStatus(job.id, newStatus);
                            });
                          }}
                          disabled={isPending}
                          className={`p-1 rounded font-bold text-xs border cursor-pointer ${getStatusColor(job.status)}`}
                        >
                          <option value="PENDING">รอดำเนินการ</option>
                          <option value="IN_PROGRESS">กำลังทำงาน</option>
                          <option value="COMPLETED">เสร็จสิ้น</option>
                          <option value="CANCELLED">ยกเลิก</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-4">
                          <button onClick={() => toggleRow(job.id)} className="cursor-pointer">
                            {isExpanded ? <ChevronUp className="w-6 h-6 text-black dark:text-white" /> : <ChevronDown className="w-6 h-6 text-black dark:text-white" />}
                          </button>
                          <button 
                            onClick={() => {
                              if(confirm("ต้องการลบงานนี้ใช่หรือไม่?")) {
                                startTransition(async () => {
                                  await deleteJob(job.id);
                                });
                              }
                            }}
                            disabled={isPending}
                            className="text-red-500 hover:text-red-700 transition cursor-pointer" title="ลบงานนี้">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b-2 border-blue-300 dark:border-blue-800">
                        <td colSpan={9} className="px-4 md:px-6 py-6">
                          <div className="flex flex-col space-y-4">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 space-y-2 md:space-y-0">
                              <h3 className="font-black text-lg text-black dark:text-white flex items-center">
                                <MapPin className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                                แผนการวิ่งรถ (Multi-Leg Routing)
                              </h3>
                              <button 
                                onClick={() => { setTransferJobId(job.id); setTransferLegs(job.legs); }}
                                className="text-sm font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100 px-4 py-2 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 border border-indigo-300 dark:border-indigo-700 transition cursor-pointer"
                              >
                                + เพิ่มงานโอนย้ายลาน
                              </button>
                            </div>
                            
                            <div className="relative flex flex-col md:flex-row items-center justify-between w-full space-y-8 md:space-y-0 pt-4 md:pt-0">
                              {/* Connecting Line (Desktop) */}
                              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-slate-300 dark:bg-slate-600 -translate-y-1/2 z-0"></div>

                              {job.legs.map((leg: any, index: number) => (
                                <div key={leg.id} className="relative z-10 flex flex-col items-center bg-slate-50 dark:bg-slate-900 px-4 w-full md:w-auto">
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white dark:border-slate-800
                                    ${leg.status === 'COMPLETED' ? 'bg-green-600' : leg.status === 'IN_TRANSIT' ? 'bg-blue-600 animate-pulse' : 'bg-slate-500'}
                                  `}>
                                    {index + 1}
                                  </div>
                                  <div className="mt-4 text-center bg-white dark:bg-slate-800 p-3 rounded-lg shadow border border-slate-200 dark:border-slate-700 w-full md:w-56">
                                    <div className="text-base font-black text-black dark:text-white">{leg.origin?.name}</div>
                                    <div className="flex flex-col items-center my-2">
                                      <ArrowRight className="w-5 h-5 text-slate-800 dark:text-slate-300" />
                                      {(leg.distanceKm > 0 || leg.estimatedHours > 0) && (
                                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                                          {leg.distanceKm} กม. ({leg.estimatedHours} ชม.)
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-base font-black text-black dark:text-white">{leg.destination?.name}</div>
                                    
                                    <div className="mt-3 flex items-center justify-center p-2 rounded border bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                                      <Truck className="w-4 h-4 mr-2 text-black dark:text-white" />
                                      <select
                                        value={leg.driverId || ""}
                                        onChange={(e) => {
                                          startTransition(async () => {
                                            await updateLegDriver(leg.id, e.target.value);
                                          });
                                        }}
                                        disabled={isPending}
                                        className="w-full bg-transparent text-sm font-black text-black dark:text-white cursor-pointer focus:outline-none"
                                      >
                                        <option value="">- เลือกคนขับ -</option>
                                        {renderDriverOptions()}
                                      </select>
                                    </div>
                                    
                                    <div className="mt-3">
                                      <select 
                                        value={leg.status}
                                        onChange={(e) => {
                                          startTransition(async () => {
                                            await updateLegStatus(leg.id, e.target.value);
                                          });
                                        }}
                                        disabled={isPending}
                                        className={`w-full p-2 rounded font-bold text-xs border cursor-pointer ${getStatusColor(leg.status)}`}
                                      >
                                        <option value="PENDING">รอดำเนินการ</option>
                                        <option value="IN_TRANSIT">กำลังเดินทาง</option>
                                        <option value="ARRIVED">ถึงจุดหมาย</option>
                                        <option value="COMPLETED">เสร็จสิ้น (Drop/Pick)</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showDriverStatus && (
        <Modal title="สถานะคนขับรถ (วันปัจจุบัน)" onClose={() => setShowDriverStatus(false)} large>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map((d: any) => {
              const isBusy = d.legs && d.legs.length > 0;
              return (
                <div key={d.id} className={`p-4 rounded-lg border-2 ${isBusy ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-extrabold text-lg text-black dark:text-white flex items-center">
                      <Truck className={`w-5 h-5 mr-2 ${isBusy ? 'text-orange-500' : 'text-green-500'}`} />
                      {d.name}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-black text-white ${isBusy ? 'bg-orange-500' : 'bg-green-500'}`}>
                      {isBusy ? 'ติดงาน' : 'ว่างรับงาน'}
                    </span>
                  </div>
                  {isBusy ? (
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                      กำลังวิ่ง: <span className="text-orange-600 dark:text-orange-400 font-bold">{d.legs[0].origin?.name} ➔ {d.legs[0].destination?.name}</span>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      พนักงานพร้อมรับงานใหม่
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {showAddCustomer && (
        <Modal title="จัดการลูกค้า" onClose={() => setShowAddCustomer(false)}>
          <form action={async (formData) => { await createCustomer(formData); }} className="mb-6">
            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">ชื่อลูกค้าใหม่</label>
            <div className="flex space-x-2">
              <input type="text" name="name" required className="flex-1 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded font-bold" placeholder="บริษัท..." />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded">เพิ่ม</button>
            </div>
          </form>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="font-bold mb-2">รายชื่อลูกค้าที่มี</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {customers.map((c: any) => (
                <li key={c.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600">
                  <span className="font-bold">{c.name}</span>
                  <button 
                    onClick={() => {
                      startTransition(async () => {
                        await deleteCustomer(c.id);
                      });
                    }}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}

      {showAddLocation && (
        <Modal title="จัดการสถานที่" onClose={() => setShowAddLocation(false)}>
          <form action={async (formData) => { await createLocation(formData); }} className="mb-6">
            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">ชื่อสถานที่ใหม่</label>
            <input type="text" name="name" required className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded mb-4 font-bold" placeholder="ลาน A..." />
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-extrabold mb-2 text-black dark:text-white">ละติจูด (Latitude)</label>
                <input type="text" name="latitude" className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded font-bold" placeholder="13.7563" />
              </div>
              <div>
                <label className="block text-sm font-extrabold mb-2 text-black dark:text-white">ลองจิจูด (Longitude)</label>
                <input type="text" name="longitude" className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded font-bold" placeholder="100.5018" />
              </div>
            </div>

            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">ประเภทสถานที่</label>
            <div className="flex space-x-2 mb-4">
              <select name="type" className="flex-1 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded font-bold">
                <option value="EMPTY_YARD">ลานตู้เปล่า</option>
                <option value="FULL_YARD">ลานตู้หนัก</option>
                <option value="FACTORY">โรงงานลูกค้า</option>
                <option value="PORT_TERMINAL">ท่าเรือ</option>
              </select>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded">เพิ่ม</button>
            </div>
          </form>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="font-bold mb-2">รายชื่อสถานที่ที่มี</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {locations.map((l: any) => (
                <li key={l.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600">
                  <span className="font-bold">{l.name} <span className="text-xs text-slate-500">({l.type})</span></span>
                  <button 
                    onClick={() => {
                      startTransition(async () => {
                        await deleteLocation(l.id);
                      });
                    }}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}

      {showAddDriver && (
        <Modal title="จัดการพนักงานขับรถ" onClose={() => setShowAddDriver(false)}>
          <form action={async (formData) => { await createDriver(formData); }} className="mb-6">
            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">ชื่อ-นามสกุล</label>
            <input type="text" name="name" required className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded mb-4 font-bold" />
            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">เบอร์โทรศัพท์</label>
            <div className="flex space-x-2 mb-4">
              <input type="text" name="phone" className="flex-1 border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded font-bold" />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded">เพิ่ม</button>
            </div>
          </form>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="font-bold mb-2">รายชื่อพนักงานที่มี</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {drivers.map((d: any) => (
                <li key={d.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600">
                  <span className="font-bold">{d.name} <span className="text-xs text-slate-500">{d.phone}</span></span>
                  <button 
                    onClick={() => {
                      startTransition(async () => {
                        await deleteDriver(d.id);
                      });
                    }}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}

      {/* INJECT TRANSFER MODAL */}
      {transferJobId && (
        <Modal title="แทรกงานโอนย้ายลาน (Inject Transfer)" onClose={() => { setTransferJobId(null); setTransferLegs([]); }}>
          <form action={async (formData) => { 
            await injectTransfer(
              transferJobId,
              formData.get("legIdToSplit") as string,
              formData.get("transferYardId") as string,
              formData.get("newDriverId") as string
            );
            setTransferJobId(null);
            setTransferLegs([]);
          }}>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 font-bold">
              ระบบจะทำการตัดเส้นทางที่คุณเลือกออกเป็น 2 ท่อน โดยใช้ "ลานโอนย้าย" เป็นจุดแวะพัก/เปลี่ยนคนขับ และจะคำนวณระยะทางใหม่ให้โดยอัตโนมัติ
            </p>

            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">เลือกเส้นทางที่ต้องการแทรก/ตัด</label>
            <select name="legIdToSplit" required className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded mb-4 font-bold">
              {transferLegs.map(leg => (
                <option key={leg.id} value={leg.id}>ท่อนที่ {leg.sequenceOrder}: {leg.origin.name} ➔ {leg.destination.name}</option>
              ))}
            </select>

            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">เลือกลานโอนย้าย (จุดดรอป)</label>
            <SearchableSelect 
              name="transferYardId" 
              options={locations.map((l: any) => ({ value: l.id, label: l.name }))} 
              placeholder="-- พิมพ์ค้นหาลาน --" 
              required 
            />
            <div className="mb-4"></div>

            <label className="block text-base font-extrabold mb-2 text-black dark:text-white">เลือกคนขับมารับช่วงต่อ (ไปปลายทางเดิม)</label>
            <select name="newDriverId" required className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white p-3 rounded mb-6 font-bold">
              <option value="">-- เลือกคนขับ --</option>
              {renderDriverOptions()}
            </select>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded text-lg shadow-lg">ยืนยันการตัดเส้นทาง</button>
          </form>
        </Modal>
      )}

      {showCreateJob && (
        <Modal title="สร้างงานใหม่" onClose={() => setShowCreateJob(false)} large>
          <form action={async (formData) => { 
            const data = {
              date: formData.get("date") as string,
              customerId: formData.get("customerId") as string,
              containerSize: formData.get("containerSize") as string,
              codeRef: formData.get("codeRef") as string,
              invoiceRef: formData.get("invoiceRef") as string,
              vgm: parseFloat(formData.get("vgm") as string) || 0,
              cutOffTime: formData.get("cutOffTime") as string,
              legs: [
                {
                  originId: formData.get("originId") as string,
                  destinationId: formData.get("destinationId") as string,
                  driverId: formData.get("driverId") as string,
                }
              ]
            };
            await createJob(data); 
            setShowCreateJob(false); 
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">วันที่</label>
                <input type="date" name="date" required className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">ลูกค้า</label>
                <select name="customerId" required className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded">
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">ขนาดตู้</label>
                <select name="containerSize" className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded">
                  <option value="FT_20">20 FT</option>
                  <option value="FT_40">40 FT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">น้ำหนัก (VGM)</label>
                <input type="number" step="0.1" name="vgm" className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded" placeholder="ตัน" />
              </div>
              <div>
                <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">รหัสงาน (Code)</label>
                <input type="text" name="codeRef" className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded" />
              </div>
              <div>
                <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">เวลา Cut-off</label>
                <input type="datetime-local" name="cutOffTime" className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded" />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-slate-800 rounded-lg mb-6 border-2 border-blue-200 dark:border-slate-600">
              <h4 className="font-extrabold text-blue-900 dark:text-blue-300 text-lg mb-4">กำหนดเส้นทางเริ่มต้น (Initial Routing)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">ต้นทาง (Origin)</label>
                  <SearchableSelect 
                    name="originId" 
                    options={locations.map((l: any) => ({ value: l.id, label: l.name }))} 
                    placeholder="-- พิมพ์ค้นหาสถานที่ --" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">ปลายทาง (Destination)</label>
                  <SearchableSelect 
                    name="destinationId" 
                    options={locations.map((l: any) => ({ value: l.id, label: l.name }))} 
                    placeholder="-- พิมพ์ค้นหาสถานที่ --" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold mb-1 text-black dark:text-white">พนักงานขับรถ</label>
                  <select name="driverId" required className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded">
                    <option value="">-- เลือกคนขับ --</option>
                    {renderDriverOptions()}
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-extrabold text-xl shadow-lg">บันทึกงานใหม่</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, large = false }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full ${large ? 'max-w-4xl' : 'max-w-md'} overflow-visible my-8 flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-xl shrink-0">
          <h2 className="text-2xl font-black text-black dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 text-3xl font-black transition-colors">&times;</button>
        </div>
        <div className="p-6 overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}

function SearchableSelect({ name, options, placeholder, required }: any) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVal, setSelectedVal] = useState("");
  
  const filteredOptions = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = options.find((o: any) => o.value === selectedVal)?.label || "";

  return (
    <div className="relative w-full">
      <input type="hidden" name={name} value={selectedVal} required={required} />
      <div 
        className="w-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-bold p-3 rounded cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedVal ? selectedLabel : placeholder}</span>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              autoFocus
              className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-black dark:text-white"
              placeholder="พิมพ์ค้นหา..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()} // prevent closing when typing
            />
          </div>
          <ul className="py-1">
            {filteredOptions.length === 0 ? (
              <li className="p-3 text-slate-500 text-center text-sm">ไม่พบข้อมูล</li>
            ) : (
              filteredOptions.map((o: any) => (
                <li
                  key={o.value}
                  className="p-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-sm font-bold border-b border-slate-100 dark:border-slate-700 last:border-0"
                  onClick={() => {
                    setSelectedVal(o.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
