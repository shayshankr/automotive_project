package com.psychrochart.app.domain

data class PsychroState(
    val dbt: Double,   // Dry-bulb temperature (°C)
    val wbt: Double,   // Wet-bulb temperature (°C)
    val dpt: Double,   // Dew-point temperature (°C)
    val rh: Double,    // Relative humidity (%)
    val w: Double,     // Humidity ratio (kg/kg dry air)
    val h: Double,     // Enthalpy (kJ/kg dry air)
    val v: Double,     // Specific volume (m³/kg dry air)
    val pv: Double,    // Vapor pressure (kPa)
    val mu: Double,    // Degree of saturation
)

enum class SecondaryInput { WBT, DPT, RH, W, V }

enum class ProcessType(val label: String) {
    SENSIBLE_HEATING("Sensible Heating"),
    SENSIBLE_COOLING("Sensible Cooling"),
    HUMIDIFICATION("Humidification"),
    DEHUMIDIFICATION("Dehumidification"),
    COOLING_DEHUMIDIFICATION("Cooling & Dehumidification"),
    HEATING_HUMIDIFICATION("Heating & Humidification"),
    EVAPORATIVE_COOLING("Evaporative Cooling"),
    ADIABATIC_MIXING("Adiabatic Mixing"),
}

data class ProcessResult(
    val state1: PsychroState,
    val state2: PsychroState,
    val processType: ProcessType,
    val metrics: Map<String, String>,
)
