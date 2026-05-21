package com.psychrochart.app.domain

import com.psychrochart.app.domain.PsychroCalc.fromDbtRh
import com.psychrochart.app.domain.PsychroCalc.fromDbtW
import com.psychrochart.app.domain.PsychroCalc.fromDbtWbt

object Processes {

    fun sensibleHeating(s1: PsychroState, dbt2: Double): ProcessResult {
        val s2 = fromDbtW(dbt2, s1.w)
        return ProcessResult(
            state1 = s1, state2 = s2,
            processType = ProcessType.SENSIBLE_HEATING,
            metrics = mapOf(
                "Heat Added (kJ/kg dry air)" to "%.3f".format(s2.h - s1.h),
                "ΔT (°C)"                   to "%.2f".format(dbt2 - s1.dbt),
                "W constant (kg/kg)"        to "%.6f".format(s1.w),
            )
        )
    }

    fun sensibleCooling(s1: PsychroState, dbt2: Double): ProcessResult {
        val s2 = fromDbtW(dbt2, s1.w)
        return ProcessResult(
            state1 = s1, state2 = s2,
            processType = ProcessType.SENSIBLE_COOLING,
            metrics = mapOf(
                "Heat Removed (kJ/kg dry air)" to "%.3f".format(s1.h - s2.h),
                "ΔT (°C)"                      to "%.2f".format(s1.dbt - dbt2),
                "W constant (kg/kg)"           to "%.6f".format(s1.w),
            )
        )
    }

    fun humidification(s1: PsychroState, w2: Double? = null, rh2Pct: Double? = null): ProcessResult {
        val s2 = if (w2 != null) fromDbtW(s1.dbt, w2) else fromDbtRh(s1.dbt, rh2Pct!!)
        return ProcessResult(
            state1 = s1, state2 = s2,
            processType = ProcessType.HUMIDIFICATION,
            metrics = mapOf(
                "Moisture Added (kg/kg dry air)" to "%.6f".format(s2.w - s1.w),
                "Enthalpy Change (kJ/kg)"        to "%.3f".format(s2.h - s1.h),
                "DBT constant (°C)"              to "%.2f".format(s1.dbt),
            )
        )
    }

    fun dehumidification(s1: PsychroState, w2: Double? = null, rh2Pct: Double? = null): ProcessResult {
        val s2 = if (w2 != null) fromDbtW(s1.dbt, w2) else fromDbtRh(s1.dbt, rh2Pct!!)
        return ProcessResult(
            state1 = s1, state2 = s2,
            processType = ProcessType.DEHUMIDIFICATION,
            metrics = mapOf(
                "Moisture Removed (kg/kg dry air)" to "%.6f".format(s1.w - s2.w),
                "Enthalpy Change (kJ/kg)"          to "%.3f".format(s1.h - s2.h),
                "DBT constant (°C)"                to "%.2f".format(s1.dbt),
            )
        )
    }

    fun coolingDehumidification(s1: PsychroState, dbt2: Double, w2: Double? = null, rh2Pct: Double? = null): ProcessResult {
        val s2 = if (w2 != null) fromDbtW(dbt2, w2) else fromDbtRh(dbt2, rh2Pct!!)
        val totalHeat = s1.h - s2.h
        val sensible  = 1.006 * (s1.dbt - s2.dbt)
        val deltaW    = s1.w - s2.w
        val latent    = 2501.0 * deltaW
        return ProcessResult(
            state1 = s1, state2 = s2,
            processType = ProcessType.COOLING_DEHUMIDIFICATION,
            metrics = mapOf(
                "Total Heat Removed (kJ/kg)"   to "%.3f".format(totalHeat),
                "Sensible Heat Removed (kJ/kg)" to "%.3f".format(sensible),
                "Latent Heat Removed (kJ/kg)"  to "%.3f".format(latent),
                "Moisture Removed (kg/kg)"     to "%.6f".format(deltaW),
            )
        )
    }

    fun heatingHumidification(s1: PsychroState, dbt2: Double, w2: Double? = null, rh2Pct: Double? = null): ProcessResult {
        val s2 = if (w2 != null) fromDbtW(dbt2, w2) else fromDbtRh(dbt2, rh2Pct!!)
        return ProcessResult(
            state1 = s1, state2 = s2,
            processType = ProcessType.HEATING_HUMIDIFICATION,
            metrics = mapOf(
                "Total Heat Added (kJ/kg)"  to "%.3f".format(s2.h - s1.h),
                "Moisture Added (kg/kg)"    to "%.6f".format(s2.w - s1.w),
                "ΔT (°C)"                  to "%.2f".format(s2.dbt - s1.dbt),
            )
        )
    }

    fun evaporativeCooling(s1: PsychroState, dbt2: Double): ProcessResult {
        val s2 = fromDbtWbt(dbt2, s1.wbt)
        return ProcessResult(
            state1 = s1, state2 = s2,
            processType = ProcessType.EVAPORATIVE_COOLING,
            metrics = mapOf(
                "Temperature Drop (°C)"  to "%.2f".format(s1.dbt - s2.dbt),
                "Moisture Added (kg/kg)" to "%.6f".format(s2.w - s1.w),
                "WBT constant (°C)"      to "%.2f".format(s1.wbt),
                "Enthalpy Change (kJ/kg)" to "%.3f".format(s2.h - s1.h),
            )
        )
    }

    fun adiabaticMixing(s1: PsychroState, s2: PsychroState, m1: Double, m2: Double): ProcessResult {
        val total = m1 + m2
        val wMix  = (m1 * s1.w + m2 * s2.w) / total
        val hMix  = (m1 * s1.h + m2 * s2.h) / total
        val dbtMix = (hMix - 2501.0 * wMix) / (1.006 + 1.86 * wMix)
        val sMix  = fromDbtW(dbtMix, wMix)
        return ProcessResult(
            state1 = s1, state2 = sMix,
            processType = ProcessType.ADIABATIC_MIXING,
            metrics = mapOf(
                "Mixed DBT (°C)"          to "%.2f".format(dbtMix),
                "Mixed W (kg/kg)"         to "%.6f".format(wMix),
                "Mixed h (kJ/kg)"         to "%.3f".format(hMix),
                "Mass flow ratio m₁:m₂"   to "$m1 : $m2",
            )
        )
    }
}
