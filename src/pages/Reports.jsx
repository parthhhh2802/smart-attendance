import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiDownload, FiFileText, FiFilter, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import sessionService from '../api/sessionService';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [reportType, setReportType] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await sessionService.getSessions();
      if (response.success) {
        setSessions(response.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedSession) {
      toast.error('Please select a session');
      return;
    }

    setLoading(true);
    try {
      const response = await sessionService.getSessionReport(selectedSession);
      if (response.success) {
        setReportData(response.report);
        toast.success('Report generated successfully!');
      }
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Attendance Report', 20, 20);
    
    // Session Info
    doc.setFontSize(12);
    doc.text(`Session: ${reportData.session.title}`, 20, 35);
    doc.text(`Date: ${reportData.session.date}`, 20, 45);
    doc.text(`Time: ${reportData.session.time}`, 20, 55);
    
    // Statistics
    doc.setFontSize(14);
    doc.text('Statistics:', 20, 70);
    doc.setFontSize(12);
    doc.text(`Total Expected: ${reportData.statistics.totalExpected}`, 30, 80);
    doc.text(`Total Present: ${reportData.statistics.totalPresent}`, 30, 90);
    doc.text(`Attendance Rate: ${reportData.statistics.attendanceRate}%`, 30, 100);
    
    if (reportData.session.feedbackRequired) {
      doc.text(`Feedback Collected: ${reportData.statistics.feedbackCount}`, 30, 110);
      doc.text(`Average Rating: ${reportData.statistics.averageRating}/5`, 30, 120);
    }
    
    // Attendance List
    let yPosition = reportData.session.feedbackRequired ? 140 : 120;
    doc.setFontSize(14);
    doc.text('Attendance List:', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    
    reportData.attendance.forEach((record, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(
        `${index + 1}. User ${record.userId} - ${new Date(record.timestamp).toLocaleString()} - ${record.status}`,
        30,
        yPosition
      );
      yPosition += 10;
    });
    
    // Save PDF
    doc.save(`attendance-report-${selectedSession}.pdf`);
    toast.success('PDF exported successfully!');
  };

  const exportToExcel = async () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');
    
    // Title
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'Attendance Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    
    // Session Info
    worksheet.addRow([]);
    worksheet.addRow(['Session:', reportData.session.title]);
    worksheet.addRow(['Date:', reportData.session.date]);
    worksheet.addRow(['Time:', reportData.session.time]);
    worksheet.addRow([]);
    
    // Statistics
    worksheet.addRow(['Statistics']);
    worksheet.addRow(['Total Expected:', reportData.statistics.totalExpected]);
    worksheet.addRow(['Total Present:', reportData.statistics.totalPresent]);
    worksheet.addRow(['Attendance Rate:', `${reportData.statistics.attendanceRate}%`]);
    
    if (reportData.session.feedbackRequired) {
      worksheet.addRow(['Feedback Collected:', reportData.statistics.feedbackCount]);
      worksheet.addRow(['Average Rating:', `${reportData.statistics.averageRating}/5`]);
    }
    
    worksheet.addRow([]);
    
    // Attendance List Headers
    worksheet.addRow(['S.No', 'User ID', 'Timestamp', 'Status', 'Feedback']);
    
    // Style headers
    const headerRow = worksheet.lastRow;
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Add attendance data
    reportData.attendance.forEach((record, index) => {
      worksheet.addRow([
        index + 1,
        `User ${record.userId}`,
        new Date(record.timestamp).toLocaleString(),
        record.status,
        reportData.session.feedbackRequired ? 'Submitted' : 'N/A'
      ]);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Save Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${selectedSession}.xlsx`;
    link.click();
    
    toast.success('Excel exported successfully!');
  };

  return (
    <div className="container py-4">
      <div className="fade-in">
        {/* Header */}
        <div className="glass-card mb-4">
          <h2 className="mb-1">Reports & Analytics</h2>
          <p className="text-muted">Generate and export attendance reports</p>
        </div>

        {/* Report Configuration */}
        <div className="glass-card mb-4">
          <h5 className="mb-3">Generate Report</h5>
          
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <FiCalendar className="me-1" />Select Session
              </label>
              <select
                className="form-select"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="">Choose a session...</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.title} - {session.date}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label">
                <FiFileText className="me-1" />Report Type
              </label>
              <select
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="attendance">Attendance Report</option>
                <option value="feedback">Feedback Analysis</option>
                <option value="comprehensive">Comprehensive Report</option>
              </select>
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div className="col-md-6 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
          
          <button
            className="btn btn-gradient w-100"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Generating Report...
              </>
            ) : (
              <>
                <FiBarChart2 className="me-2" />Generate Report
              </>
            )}
          </button>
        </div>

        {/* Report Preview */}
        {reportData && (
          <div className="glass-card mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Report Preview</h5>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-gradient" onClick={exportToPDF}>
                  <FiDownload className="me-1" />PDF
                </button>
                <button className="btn btn-sm btn-outline-gradient" onClick={exportToExcel}>
                  <FiDownload className="me-1" />Excel
                </button>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-3 col-sm-6 mb-2">
                <div className="stat-card">
                  <div className="stat-value">{reportData.statistics.totalExpected}</div>
                  <div className="stat-label">Total Expected</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-2">
                <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
                  <div className="stat-value">{reportData.statistics.totalPresent}</div>
                  <div className="stat-label">Present</div>
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-2">
                <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
                  <div className="stat-value">{reportData.statistics.attendanceRate}%</div>
                  <div className="stat-label">Attendance Rate</div>
                </div>
              </div>
              {reportData.session.feedbackRequired && (
                <div className="col-md-3 col-sm-6 mb-2">
                  <div className="stat-card" style={{ borderLeftColor: '#8b5cf6' }}>
                    <div className="stat-value">⭐ {reportData.statistics.averageRating}</div>
                    <div className="stat-label">Avg Rating</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>User ID</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                    {reportData.session.feedbackRequired && <th>Feedback</th>}
                  </tr>
                </thead>
                <tbody>
                  {reportData.attendance.slice(0, 10).map((record, index) => (
                    <tr key={record.id}>
                      <td>{index + 1}</td>
                      <td>User {record.userId}</td>
                      <td>{new Date(record.timestamp).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-success">Present</span>
                      </td>
                      {reportData.session.feedbackRequired && (
                        <td>
                          <span className="badge bg-primary">Submitted</span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.attendance.length > 10 && (
                <div className="text-center text-muted">
                  <small>Showing 10 of {reportData.attendance.length} records</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;