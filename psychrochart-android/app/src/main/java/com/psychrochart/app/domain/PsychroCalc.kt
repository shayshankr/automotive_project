package com.psychrochart.app.domain

import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.abs

/**
 * Pure-Kotlin implementation of ASHRAE psychrometric formulas (SI units).
 * Mirrors the logic of psychrolib used in the original Python app.
 */
object PsychroCalc {

    const val PRESSURE = 101325.0   // Pa, standard sea-level
    private const val W_EPSILON = 1e-7

    // ── Saturation pressure (ASHRAE 2009 fundamentals, eq 5 & 6) ─────────────

    fun saturationPressure(tCelsius: Double): Double {
        val T = tCelsius + 273.15
        return if (tCelsius >= 0.0) {
            val c8  = -5.8002206e3
            val c9  =  1.3914993
            val c10 = -4.8640239e-2
            val c11 =  4.1764768e-5
            val c12 = -1.4452093e-8
            val c13 =  6.5459673
            exp(c8 / T + c9 + c10 * T + c11 * T * T + c12 * T * T * T + c13 * ln(T))
        } else {
            val c1 = -5.6745359e3
            val c2 =  6.3925247
            val c3 = -9.677843e-3
            val c4 =  6.2215701e-7
            val c5 =  2.0747825e-9
            val c6 = -9.484024e-13
            val c7 =  4.1635019
            exp(c1 / T + c2 + c3 * T + c4 * T * T + c5 * T * T * T +
                c6 * T * T * T * T + c7 * ln(T))
        }
    }

    // ── Humidity ratio helpers ─────────────────────────────────────────────────

    fun humRatioFromRelHum(dbt: Double, rhFrac: Double): Double {
        val pws = saturationPressure(dbt)
        return maxOf(W_EPSILON, 0.621945 * pws * rhFrac / (PRESSURE - pws * rhFrac))
    }

    fun humRatioFromWetBulb(dbt: Double, wbt: Double): Double {
        val wsWb = humRatioFromRelHum(wbt, 1.0)
        val w = ((2501.0 - 2.381 * wbt) * wsWb - 1.006 * (dbt - wbt)) /
                (2501.0 + 1.86 * dbt - 4.186 * wbt)
        return maxOf(W_EPSILON, w)
    }

    fun humRatioFromDewPoint(dpt: Double): Double =
        humRatioFromRelHum(dpt, 1.0)

    fun humRatioFromSpecVol(dbt: Double, v: Double): Double {
        val T = dbt + 273.15
        val w = (v * PRESSURE / (287.042 * T) - 1.0) / 1.6078
        return maxOf(W_EPSILON, w)
    }

    // ── Derived properties from (DBT, W) ──────────────────────────────────────

    fun wetBulbFromHumRatio(dbt: Double, w: Double): Double {
        // Bisection: find WBT in [−50, DBT] where humRatioFromWetBulb(dbt, WBT) == w
        var lo = maxOf(-50.0, dbt - 60.0)
        var hi = dbt
        repeat(60) {
            val mid = (lo + hi) / 2.0
            if (humRatioFromWetBulb(dbt, mid) > w) hi = mid else lo = mid
        }
        return (lo + hi) / 2.0
    }

    fun dewPointFromHumRatio(w: Double): Double {
        // Bisection: find T where humRatioFromRelHum(T, 1.0) == w
        var lo = -60.0
        var hi = 90.0
        repeat(60) {
            val mid = (lo + hi) / 2.0
            if (humRatioFromRelHum(mid, 1.0) < w) lo = mid else hi = mid
        }
        return (lo + hi) / 2.0
    }

    fun relHumFromHumRatio(dbt: Double, w: Double): Double {
        val ws = humRatioFromRelHum(dbt, 1.0)
        return (w / ws).coerceIn(0.0, 1.0)
    }

    fun enthalpyFromHumRatio(dbt: Double, w: Double): Double =
        1.006 * dbt + w * (2501.0 + 1.86 * dbt)   // kJ/kg dry air

    fun specVolFromHumRatio(dbt: Double, w: Double): Double =
        287.042 * (dbt + 273.15) * (1.0 + 1.6078 * w) / PRESSURE

    fun vaporPressureFromHumRatio(w: Double): Double =
        w * PRESSURE / (0.621945 + w) / 1000.0     // kPa

    fun degreeOfSaturation(dbt: Double, w: Double): Double {
        val ws = humRatioFromRelHum(dbt, 1.0)
        return w / ws
    }

    // ── Full state builder ─────────────────────────────────────────────────────

    fun makeState(dbt: Double, w: Double): PsychroState {
        val safeW = maxOf(W_EPSILON, w)
        return PsychroState(
            dbt = dbt.round(2),
            wbt = wetBulbFromHumRatio(dbt, safeW).round(2),
            dpt = dewPointFromHumRatio(safeW).round(2),
            rh  = (relHumFromHumRatio(dbt, safeW) * 100).round(1),
            w   = safeW.round(6),
            h   = enthalpyFromHumRatio(dbt, safeW).round(3),
            v   = specVolFromHumRatio(dbt, safeW).round(4),
            pv  = vaporPressureFromHumRatio(safeW).round(4),
            mu  = degreeOfSaturation(dbt, safeW).round(4),
        )
    }

    fun fromDbtRh(dbt: Double, rhPct: Double) =
        makeState(dbt, humRatioFromRelHum(dbt, rhPct / 100.0))

    fun fromDbtWbt(dbt: Double, wbt: Double) =
        makeState(dbt, humRatioFromWetBulb(dbt, wbt))

    fun fromDbtDpt(dbt: Double, dpt: Double) =
        makeState(dbt, humRatioFromDewPoint(dpt))

    fun fromDbtW(dbt: Double, w: Double) =
        makeState(dbt, w)

    fun fromDbtV(dbt: Double, v: Double) =
        makeState(dbt, humRatioFromSpecVol(dbt, v))

    // ── Chart line data ────────────────────────────────────────────────────────

    data class LineData(val points: List<Pair<Double, Double>>)

    fun saturationCurve(dbtMin: Double = -10.0, dbtMax: Double = 50.0, steps: Int = 300): LineData {
        val pts = (0..steps).mapNotNull { i ->
            val t = dbtMin + i * (dbtMax - dbtMin) / steps
            val w = humRatioFromRelHum(t, 1.0)
            if (w in 0.0..0.031) Pair(t, w) else null
        }
        return LineData(pts)
    }

    fun constantRhCurve(rhFrac: Double, dbtMin: Double = -10.0, dbtMax: Double = 50.0, steps: Int = 200): LineData {
        val pts = (0..steps).mapNotNull { i ->
            val t = dbtMin + i * (dbtMax - dbtMin) / steps
            val w = humRatioFromRelHum(t, rhFrac)
            if (w in 0.0..0.031) Pair(t, w) else null
        }
        return LineData(pts)
    }

    fun constantWbtCurve(wbt: Double, dbtMin: Double = -10.0, dbtMax: Double = 50.0, steps: Int = 200): LineData {
        val lo = maxOf(wbt, dbtMin)
        val pts = (0..steps).mapNotNull { i ->
            val t = lo + i * (dbtMax - lo) / steps
            if (t < wbt) return@mapNotNull null
            val w = humRatioFromWetBulb(t, wbt)
            if (w in 0.0..0.031) Pair(t, w) else null
        }
        return LineData(pts)
    }

    fun constantEnthalpyCurve(hKj: Double, dbtMin: Double = -10.0, dbtMax: Double = 50.0, steps: Int = 200): LineData {
        val pts = (0..steps).mapNotNull { i ->
            val t = dbtMin + i * (dbtMax - dbtMin) / steps
            val denom = 2501.0 + 1.86 * t
            if (denom <= 0) return@mapNotNull null
            val w = (hKj - 1.006 * t) / denom
            if (w in 0.0..0.031) Pair(t, w) else null
        }
        return LineData(pts)
    }

    fun constantSpecVolCurve(v: Double, dbtMin: Double = -10.0, dbtMax: Double = 50.0, steps: Int = 200): LineData {
        val pts = (0..steps).mapNotNull { i ->
            val t = dbtMin + i * (dbtMax - dbtMin) / steps
            val w = humRatioFromSpecVol(t, v)
            if (w in 0.0..0.031) Pair(t, w) else null
        }
        return LineData(pts)
    }

    private fun Double.round(decimals: Int): Double {
        val factor = Math.pow(10.0, decimals.toDouble())
        return Math.round(this * factor) / factor
    }
}
