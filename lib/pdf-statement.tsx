"use client"

import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  pdf,
} from "@react-pdf/renderer"
import type { Shift } from "@/lib/schemas/shift-form-schema"
import {
  calculateShiftDurationHours,
  calculateShiftIncome,
  formatCurrency,
  formatDisplayTime,
  formatShiftDisplayDate,
} from "@/lib/time-utils"

// Register Inter Font for vector PDF rendering
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf",
      fontWeight: 600,
    },
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
      fontWeight: 700,
    },
  ],
})

// 1 inch = 72 pt padding on A4 (595.28 x 841.89 pt)
const styles = StyleSheet.create({
  page: {
    size: "A4",
    padding: 72,
    fontFamily: "Inter",
    fontSize: 9,
    color: "#09090B",
    backgroundColor: "#FFFFFF",
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
    borderBottomStyle: "solid",
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  titleBlock: {
    flexDirection: "column",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#09090B",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 8.5,
    fontWeight: 400,
    color: "#71717A",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  statementMetaBold: {
    fontSize: 9,
    fontWeight: 700,
    color: "#09090B",
  },
  statementMetaText: {
    fontSize: 8,
    fontWeight: 400,
    color: "#71717A",
    marginTop: 2,
  },
  // Metadata Bar
  metaBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F4F4F5",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: 7.5,
    fontWeight: 500,
    color: "#71717A",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9.5,
    fontWeight: 700,
    color: "#09090B",
  },
  // 4 Summary KPI Cards (Cheq 4-Card System)
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderStyle: "solid",
    borderRadius: 6,
    padding: 9,
    backgroundColor: "#FFFFFF",
  },
  kpiLabel: {
    fontSize: 7.5,
    fontWeight: 500,
    color: "#71717A",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  kpiValue: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#09090B",
  },
  // Table
  tableContainer: {
    flexDirection: "column",
    width: "100%",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderStyle: "solid",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F4F4F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
    borderBottomStyle: "solid",
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: "#18181B",
    fontWeight: 700,
    fontSize: 7.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
    borderBottomStyle: "solid",
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: "#FAFAFA",
  },
  tableCell: {
    fontSize: 8,
    fontWeight: 400,
    color: "#18181B",
  },
  tableCellBold: {
    fontSize: 8,
    fontWeight: 600,
    color: "#09090B",
  },
  // Column Vertical Dividers
  colBorder: {
    borderRightWidth: 1,
    borderRightColor: "#E4E4E7",
    borderRightStyle: "solid",
    paddingRight: 4,
  },
  // Column Widths (Sum = 100%)
  colNo: { width: "5%", textAlign: "center" },
  colDate: { width: "15%" },
  colWorkplace: { width: "25%" },
  colTime: { width: "19%" },
  colBreak: { width: "8%", textAlign: "center" },
  colNetHours: { width: "9%", textAlign: "right" },
  colRate: { width: "9%", textAlign: "right" },
  colTotal: { width: "10%", textAlign: "right" },
  // Total Row (Bigger Typography per requirement)
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#F4F4F5",
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderTopWidth: 1.5,
    borderTopColor: "#18181B",
    borderTopStyle: "solid",
  },
  totalCellBold: {
    fontSize: 11,
    fontWeight: 700,
    color: "#09090B",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 36,
    left: 72,
    right: 72,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  footerNotice: {
    fontSize: 7,
    fontWeight: 400,
    color: "#A1A1AA",
    maxWidth: 340,
  },
  footerPageNum: {
    fontSize: 7.5,
    fontWeight: 500,
    color: "#71717A",
  },
})

export interface StatementPDFProps {
  shifts: Shift[]
  userName?: string
  userEmail?: string
  scopeLabel: string
  statementId: string
  logoUrl?: string
  timeFormat?: "12h" | "24h"
}

export function StatementPDF({
  shifts,
  userName = "Valued User",
  userEmail = "",
  scopeLabel = "Current Month",
  statementId,
  logoUrl,
  timeFormat = "12h",
}: StatementPDFProps) {
  const totalEarnings = shifts.reduce(
    (acc, s) => acc + calculateShiftIncome(s.start_time, s.end_time, s.hourly_rate, s.break_duration),
    0
  )
  const totalHours = shifts.reduce(
    (acc, s) => acc + calculateShiftDurationHours(s.start_time, s.end_time, s.break_duration),
    0
  )
  const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0
  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Document title={`Cheq Statement ${statementId}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
            <View style={styles.titleBlock}>
              <Text style={styles.title}>CHEQ</Text>
              <Text style={styles.subtitle}>Official Earnings & Shift Statement</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.statementMetaBold}>{statementId}</Text>
            <Text style={styles.statementMetaText}>Issued: {todayStr}</Text>
          </View>
        </View>

        {/* User & Period Metadata Bar */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Account Holder</Text>
            <Text style={styles.metaValue}>{userName}</Text>
          </View>
          {userEmail ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Email</Text>
              <Text style={styles.metaValue}>{userEmail}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Statement Period</Text>
            <Text style={styles.metaValue}>{scopeLabel}</Text>
          </View>
        </View>

        {/* 4 Summary KPI Cards (Cheq System) */}
        <View style={styles.summaryGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Earned</Text>
            <Text style={styles.kpiValue}>{formatCurrency(totalEarnings)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Hours</Text>
            <Text style={styles.kpiValue}>{totalHours.toFixed(1)} hrs</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Avg Rate</Text>
            <Text style={styles.kpiValue}>${avgRate.toFixed(2)}/hr</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Shifts</Text>
            <Text style={styles.kpiValue}>{shifts.length}</Text>
          </View>
        </View>

        {/* Itemized Shift Table (Base UI Table Border Architecture) */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo, styles.colBorder]}>No.</Text>
            <Text style={[styles.tableHeaderCell, styles.colDate, styles.colBorder]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.colWorkplace, styles.colBorder]}>Workplace</Text>
            <Text style={[styles.tableHeaderCell, styles.colTime, styles.colBorder]}>Time</Text>
            <Text style={[styles.tableHeaderCell, styles.colBreak, styles.colBorder]}>Break</Text>
            <Text style={[styles.tableHeaderCell, styles.colNetHours, styles.colBorder]}>Hours</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate, styles.colBorder]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {/* Table Rows */}
          {shifts.map((shift, idx) => {
            const hrs = calculateShiftDurationHours(
              shift.start_time,
              shift.end_time,
              shift.break_duration
            )
            const income = calculateShiftIncome(
              shift.start_time,
              shift.end_time,
              shift.hourly_rate,
              shift.break_duration
            )
            const startTimeStr = formatDisplayTime(shift.start_time, timeFormat)
            const endTimeStr = formatDisplayTime(shift.end_time, timeFormat)
            const timeRangeStr = `${startTimeStr} – ${endTimeStr}`
            const dateStr = formatShiftDisplayDate(shift.shift_date) || shift.shift_date

            return (
              <View
                key={shift.id || idx}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowEven : {},
                ]}
              >
                <Text style={[styles.tableCell, styles.colNo, styles.colBorder]}>{idx + 1}</Text>
                <Text style={[styles.tableCellBold, styles.colDate, styles.colBorder]}>{dateStr}</Text>
                <Text style={[styles.tableCell, styles.colWorkplace, styles.colBorder]}>
                  {shift.workplace_name || "Shift"}
                </Text>
                <Text style={[styles.tableCell, styles.colTime, styles.colBorder]}>{timeRangeStr}</Text>
                <Text style={[styles.tableCell, styles.colBreak, styles.colBorder]}>
                  {shift.break_duration ? `${shift.break_duration}m` : "0m"}
                </Text>
                <Text style={[styles.tableCell, styles.colNetHours, styles.colBorder]}>
                  {hrs.toFixed(1)}h
                </Text>
                <Text style={[styles.tableCell, styles.colRate, styles.colBorder]}>
                  ${(shift.hourly_rate || 0).toFixed(2)}
                </Text>
                <Text style={[styles.tableCellBold, styles.colTotal]}>
                  ${income.toFixed(2)}
                </Text>
              </View>
            )
          })}

          {/* Table Totals Row */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalCellBold, { width: "90%" }, styles.colBorder]}>
              TOTAL
            </Text>
            <Text style={[styles.totalCellBold, styles.colTotal]}>
              {formatCurrency(totalEarnings)}
            </Text>
          </View>
        </View>

        {/* Footer Notice */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerNotice}>
            This document is an official summary of shift hours and income logged using Cheq. Calculated figures are based on user-recorded shift durations and rates.
          </Text>
          <Text
            style={styles.footerPageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export async function downloadStatementPDF(props: StatementPDFProps) {
  const blob = await pdf(<StatementPDF {...props} />).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `cheq-statement-${props.statementId.toLowerCase()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
