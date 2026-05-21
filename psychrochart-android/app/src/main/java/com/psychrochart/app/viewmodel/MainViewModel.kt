package com.psychrochart.app.viewmodel

import androidx.lifecycle.ViewModel
import com.psychrochart.app.domain.*
import com.psychrochart.app.domain.PsychroCalc.fromDbtDpt
import com.psychrochart.app.domain.PsychroCalc.fromDbtRh
import com.psychrochart.app.domain.PsychroCalc.fromDbtV
import com.psychrochart.app.domain.PsychroCalc.fromDbtW
import com.psychrochart.app.domain.PsychroCalc.fromDbtWbt
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class MainViewModel : ViewModel() {

    // ── State point calculator ─────────────────────────────────────────────────

    private val _stateResult = MutableStateFlow<PsychroState?>(null)
    val stateResult: StateFlow<PsychroState?> = _stateResult.asStateFlow()

    private val _stateError = MutableStateFlow<String?>(null)
    val stateError: StateFlow<String?> = _stateError.asStateFlow()

    fun calculateState(dbt: Double, secondary: SecondaryInput, value: Double) {
        runCatching {
            when (secondary) {
                SecondaryInput.WBT -> fromDbtWbt(dbt, value)
                SecondaryInput.DPT -> fromDbtDpt(dbt, value)
                SecondaryInput.RH  -> fromDbtRh(dbt, value)
                SecondaryInput.W   -> fromDbtW(dbt, value)
                SecondaryInput.V   -> fromDbtV(dbt, value)
            }
        }.onSuccess { state ->
            _stateResult.value = state
            _stateError.value = null
            addPlottedState(state)
        }.onFailure { e ->
            _stateError.value = "Calculation error: ${e.message}"
        }
    }

    // ── Process analysis ──────────────────────────────────────────────────────

    private val _processResult = MutableStateFlow<ProcessResult?>(null)
    val processResult: StateFlow<ProcessResult?> = _processResult.asStateFlow()

    private val _processError = MutableStateFlow<String?>(null)
    val processError: StateFlow<String?> = _processError.asStateFlow()

    fun runProcess(
        processType: ProcessType,
        s1: PsychroState,
        param1: Double,
        param2: Double? = null,
        param3: Double? = null,
        useW: Boolean = true,
    ) {
        runCatching {
            when (processType) {
                ProcessType.SENSIBLE_HEATING ->
                    Processes.sensibleHeating(s1, param1)
                ProcessType.SENSIBLE_COOLING ->
                    Processes.sensibleCooling(s1, param1)
                ProcessType.HUMIDIFICATION ->
                    if (useW) Processes.humidification(s1, w2 = param1)
                    else Processes.humidification(s1, rh2Pct = param1)
                ProcessType.DEHUMIDIFICATION ->
                    if (useW) Processes.dehumidification(s1, w2 = param1)
                    else Processes.dehumidification(s1, rh2Pct = param1)
                ProcessType.COOLING_DEHUMIDIFICATION ->
                    if (useW) Processes.coolingDehumidification(s1, param1, w2 = param2)
                    else Processes.coolingDehumidification(s1, param1, rh2Pct = param2)
                ProcessType.HEATING_HUMIDIFICATION ->
                    if (useW) Processes.heatingHumidification(s1, param1, w2 = param2)
                    else Processes.heatingHumidification(s1, param1, rh2Pct = param2)
                ProcessType.EVAPORATIVE_COOLING ->
                    Processes.evaporativeCooling(s1, param1)
                ProcessType.ADIABATIC_MIXING -> {
                    val s2 = fromDbtW(param1, param2!!)
                    Processes.adiabaticMixing(s1, s2, param3 ?: 1.0, 1.0)
                }
            }
        }.onSuccess { result ->
            _processResult.value = result
            _processError.value = null
            addPlottedState(result.state1, "State 1")
            addPlottedState(result.state2, "State 2")
        }.onFailure { e ->
            _processError.value = "Process error: ${e.message}"
        }
    }

    // ── Chart state management ─────────────────────────────────────────────────

    data class PlottedState(val state: PsychroState, val label: String)

    private val _plottedStates = MutableStateFlow<List<PlottedState>>(emptyList())
    val plottedStates: StateFlow<List<PlottedState>> = _plottedStates.asStateFlow()

    private var labelCounter = 1

    fun addPlottedState(state: PsychroState, label: String? = null) {
        val lbl = label ?: "P${labelCounter++}"
        val current = _plottedStates.value.toMutableList()
        current.removeAll { it.label == lbl }
        current.add(PlottedState(state, lbl))
        _plottedStates.value = current.takeLast(6)
    }

    fun clearPlottedStates() {
        _plottedStates.value = emptyList()
        labelCounter = 1
    }

    fun clearResults() {
        _stateResult.value = null
        _stateError.value = null
        _processResult.value = null
        _processError.value = null
    }
}
