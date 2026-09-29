import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
  TrendingDown, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Users, 
  Flame, 
  Calendar,
  Sparkles,
  Download,
  Printer
} from 'lucide-react';
import { useBoard } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import { exportBoardToCSV, generatePrintableReport } from '../utils/export';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
);

export default function AnalyticsView() {
  const { currentBoard, tasks, allTasks, columns } = useBoard();
  const { users } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // SVG ref for D3 Burndown chart
  const d3SvgRef = useRef(null);

  const handleExportCSV = () => {
    exportBoardToCSV({
      board: currentBoard,
      tasks: allTasks || tasks,
      columns,
      users
    });
  };

  const handlePrint = () => {
    generatePrintableReport({
      board: currentBoard,
      tasks: allTasks || tasks,
      columns,
      users
    });
  };

  useEffect(() => {
    if (!currentBoard) return;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics/${currentBoard.id}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [currentBoard]);

  // Render D3.js Sprint Burndown Chart
  useEffect(() => {
    if (!data || !data.burndownData || !d3SvgRef.current) return;

    const burndown = data.burndownData;
    const container = d3SvgRef.current;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 700;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 35, left: 45 };

    const svg = d3
      .select(container)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([1, burndown.length])
      .range([margin.left, width - margin.right]);

    const maxHours = d3.max(burndown, d => Math.max(d.ideal || 0, d.actual || 0)) || 100;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxHours * 1.1])
      .range([height - margin.bottom, margin.top]);

    // Gradient definition
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'burndown-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.4);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // Grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(burndown.length)
          .tickSize(-(height - margin.top - margin.bottom))
          .tickFormat('')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.05)'));

    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-(width - margin.left - margin.right))
          .tickFormat('')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(255,255,255,0.05)'));

    // Ideal Guideline (Dashed line)
    const idealLine = d3
      .line()
      .x(d => xScale(d.dayNumber))
      .y(d => yScale(d.ideal));

    svg
      .append('path')
      .datum(burndown)
      .attr('fill', 'none')
      .attr('stroke', '#64748b')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', idealLine);

    // Actual Burndown Area Fill (only for completed days)
    const actualData = burndown.filter(d => d.actual !== null);
    if (actualData.length > 0) {
      const area = d3
        .area()
        .x(d => xScale(d.dayNumber))
        .y0(height - margin.bottom)
        .y1(d => yScale(d.actual))
        .curve(d3.curveMonotoneX);

      svg.append('path').datum(actualData).attr('fill', 'url(#burndown-area-grad)').attr('d', area);

      // Actual Line
      const actualLine = d3
        .line()
        .x(d => xScale(d.dayNumber))
        .y(d => yScale(d.actual))
        .curve(d3.curveMonotoneX);

      svg
        .append('path')
        .datum(actualData)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 3)
        .attr('d', actualLine);

      // Dots on actual points
      svg
        .selectAll('.dot')
        .data(actualData)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.dayNumber))
        .attr('cy', d => yScale(d.actual))
        .attr('r', 4.5)
        .attr('fill', '#06b6d4')
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2);
    }

    // X Axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(burndown.length)
          .tickFormat(d => `D${d}`)
      )
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)'))
      .call(g => g.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '11px'));

    // Y Axis
    svg
      .append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${d}h`))
      .call(g => g.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)'))
      .call(g => g.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '11px'));
  }, [data]);

  if (loading || !data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading real-time executive analytics...
      </div>
    );
  }

  // Chart.js Task Status Doughnut configuration
  const doughnutData = {
    labels: data.columnDistribution.map(c => c.title),
    datasets: [
      {
        data: data.columnDistribution.map(c => c.count),
        backgroundColor: [
          '#64748B',
          '#3B82F6',
          '#F59E0B',
          '#8B5CF6',
          '#10B981'
        ],
        borderWidth: 2,
        borderColor: '#0f172a',
        hoverOffset: 6
      }
    ]
  };

  // Chart.js Member Workload Bar configuration
  const barData = {
    labels: data.memberWorkload.map(m => m.name.split(' ')[0]),
    datasets: [
      {
        label: 'Assigned Effort (h)',
        data: data.memberWorkload.map(m => m.assignedHours),
        backgroundColor: 'rgba(99, 102, 241, 0.75)',
        borderRadius: 4
      },
      {
        label: 'Logged Effort (h)',
        data: data.memberWorkload.map(m => m.loggedHours),
        backgroundColor: 'rgba(6, 182, 212, 0.85)',
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="view-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Executive Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-6px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Executive Sprint Intelligence</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Velocity tracking, burndown projections, and resource allocation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn-primary" style={{ fontSize: '12px', padding: '7px 14px' }}>
            <Printer size={14} /> Print Executive Report
          </button>
        </div>
      </div>

      {/* Top KPI Scorecards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': '#6366f1' }}>
          <div className="kpi-label">Sprint Completion Rate</div>
          <div className="kpi-value" style={{ color: '#818cf8' }}>
            {data.kpis.completionRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data.kpis.completedCount} of {data.kpis.totalTasks} tasks closed
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#06b6d4' }}>
          <div className="kpi-label">Total Hours Tracked</div>
          <div className="kpi-value" style={{ color: '#38bdf8' }}>
            {data.kpis.totalLoggedHours}h
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Estimated target: {data.kpis.totalEstimatedHours}h
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' }}>
          <div className="kpi-label">Sprint Timeline</div>
          <div className="kpi-value" style={{ color: '#fbbf24' }}>
            Day {data.kpis.activeSprintDay}
            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>
              /{data.kpis.totalSprintDays}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Active 2-week agile iteration
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#10b981' }}>
          <div className="kpi-label">Checklist Quality Index</div>
          <div className="kpi-value" style={{ color: '#34d399' }}>
            {data.kpis.checklistProgress}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Acceptance criteria verified
          </div>
        </div>
      </div>

      {/* Main Charts Row: D3 Burndown Chart (Left) + Task Distribution Donut (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        {/* D3 Sprint Burndown Curve */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="#f43f5e" />
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>D3.js Sprint Burndown Trajectory</h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Real-time remaining effort curve versus mathematical ideal velocity
              </p>
            </div>

            {/* Chart Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                <span style={{ width: '14px', height: '2px', background: '#64748b', display: 'inline-block', borderTop: '2px dashed #64748b' }} />
                Ideal Guideline
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 600 }}>
                <span style={{ width: '14px', height: '3px', background: '#06b6d4', display: 'inline-block', borderRadius: '2px' }} />
                Actual Burn
              </span>
            </div>
          </div>

          <div style={{ width: '100%', minHeight: '300px' }}>
            <svg ref={d3SvgRef} style={{ width: '100%', overflow: 'visible' }} />
          </div>
        </div>

        {/* Chart.js Status Doughnut */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#6366f1" />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Task Distribution by Column</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Breakdown across workflow stages
            </p>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '230px', position: 'relative' }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 }
                  },
                  tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#cbd5e1'
                  }
                },
                cutout: '70%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Row: Team Member Velocity & Hours Logged (Bar Chart) */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#10b981" />
              <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Team Velocity & Workload Allocation</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Comparison of assigned estimated hours vs live active stopwatch hours per teammate
            </p>
          </div>
        </div>

        <div style={{ height: '240px' }}>
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  align: 'end',
                  labels: { color: '#94a3b8', font: { size: 11 } }
                },
                tooltip: {
                  backgroundColor: '#1e293b',
                  titleColor: '#f8fafc',
                  bodyColor: '#cbd5e1'
                }
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: { color: '#94a3b8', font: { size: 12 } }
                },
                y: {
                  grid: { color: 'rgba(255,255,255,0.06)' },
                  ticks: { color: '#94a3b8', callback: val => `${val}h` }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
