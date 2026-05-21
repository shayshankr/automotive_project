package com.psychrochart.app.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.psychrochart.app.domain.ProcessType
import com.psychrochart.app.domain.SecondaryInput
import com.psychrochart.app.ui.components.MetricsCard
import com.psychrochart.app.ui.components.StateResultCard
import com.psychrochart.app.viewmodel.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProcessScreen(vm: MainViewModel) {
    val processResult by vm.processResult.collectAsState()
    val processError  by vm.processError.collectAsState()

    // Initial state inputs
    var dbt1  by remember { mutableStateOf("30") }
    var sec1  by remember { mutableStateOf("50") }
    var secIn1 by remember { mutableStateOf(SecondaryInput.RH) }
    var dropIn1 by remember { mutableStateOf(false) }

    // Process type
    var processType by remember { mutableStateOf(ProcessType.SENSIBLE_COOLING) }
    var dropType   by remember { mutableStateOf(false) }

    // Process parameter inputs
    var param1 by remember { mutableStateOf("20") }
    var param2 by remember { mutableStateOf("40") }
    var param3 by remember { mutableStateOf("1.0") }
    var useW   by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Process Analysis", style = MaterialTheme.typography.headlineMedium)

        // ── Initial state ──────────────────────────────────────────────────────
        SectionLabel("Initial State (State 1)")

        OutlinedTextField(
            value = dbt1,
            onValueChange = { dbt1 = it },
            label = { Text("DBT (°C)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        ExposedDropdownMenuBox(expanded = dropIn1, onExpandedChange = { dropIn1 = it }) {
            OutlinedTextField(
                value = secInputLabel(secIn1),
                onValueChange = {},
                readOnly = true,
                label = { Text("Second input") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(dropIn1) },
                modifier = Modifier.menuAnchor().fillMaxWidth(),
            )
            ExposedDropdownMenu(expanded = dropIn1, onDismissRequest = { dropIn1 = false }) {
                SecondaryInput.entries.forEach { opt ->
                    DropdownMenuItem(
                        text = { Text(secInputLabel(opt)) },
                        onClick = { secIn1 = opt; dropIn1 = false }
                    )
                }
            }
        }

        OutlinedTextField(
            value = sec1,
            onValueChange = { sec1 = it },
            label = { Text("${secInputLabel(secIn1)} (${secInputUnit(secIn1)})") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        // ── Process type ───────────────────────────────────────────────────────
        SectionLabel("Process Type")

        ExposedDropdownMenuBox(expanded = dropType, onExpandedChange = { dropType = it }) {
            OutlinedTextField(
                value = processType.label,
                onValueChange = {},
                readOnly = true,
                label = { Text("Process") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(dropType) },
                modifier = Modifier.menuAnchor().fillMaxWidth(),
            )
            ExposedDropdownMenu(expanded = dropType, onDismissRequest = { dropType = false }) {
                ProcessType.entries.forEach { pt ->
                    DropdownMenuItem(
                        text = { Text(pt.label) },
                        onClick = { processType = pt; dropType = false }
                    )
                }
            }
        }

        // ── Process parameters (dynamic) ──────────────────────────────────────
        SectionLabel("Process Parameters")
        ProcessParams(processType, param1, { param1 = it }, param2, { param2 = it },
            param3, { param3 = it }, useW, { useW = it })

        // ── Run button ─────────────────────────────────────────────────────────
        Button(
            onClick = {
                val dbt  = dbt1.toDoubleOrNull() ?: return@Button
                val sec  = sec1.toDoubleOrNull()  ?: return@Button
                val p1   = param1.toDoubleOrNull() ?: return@Button
                val p2   = param2.toDoubleOrNull()
                val p3   = param3.toDoubleOrNull()
                val s1 = buildState(vm, dbt, secIn1, sec) ?: return@Button
                vm.runProcess(processType, s1, p1, p2, p3, useW)
            },
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Default.PlayArrow, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Run Process")
        }

        processError?.let {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                Text(it, modifier = Modifier.padding(12.dp), color = MaterialTheme.colorScheme.onErrorContainer)
            }
        }

        processResult?.let { result ->
            MetricsCard(result.metrics, title = result.processType.label)
            Spacer(Modifier.height(4.dp))
            StateResultCard(result.state2, title = "Final State (State 2)")
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(text, style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(top = 4.dp))
}

@Composable
private fun ProcessParams(
    type: ProcessType,
    p1: String, onP1: (String) -> Unit,
    p2: String, onP2: (String) -> Unit,
    p3: String, onP3: (String) -> Unit,
    useW: Boolean, onUseW: (Boolean) -> Unit,
) {
    when (type) {
        ProcessType.SENSIBLE_HEATING, ProcessType.SENSIBLE_COOLING,
        ProcessType.EVAPORATIVE_COOLING -> {
            NumberField("Final DBT (°C)", p1, onP1)
        }
        ProcessType.HUMIDIFICATION, ProcessType.DEHUMIDIFICATION -> {
            WOrRhToggle(useW, onUseW)
            if (useW) NumberField("Final W (kg/kg)", p1, onP1)
            else      NumberField("Final RH (%)", p1, onP1)
        }
        ProcessType.COOLING_DEHUMIDIFICATION, ProcessType.HEATING_HUMIDIFICATION -> {
            NumberField("Final DBT (°C)", p1, onP1)
            WOrRhToggle(useW, onUseW)
            if (useW) NumberField("Final W (kg/kg)", p2, onP2)
            else      NumberField("Final RH (%)", p2, onP2)
        }
        ProcessType.ADIABATIC_MIXING -> {
            NumberField("State 2 — DBT (°C)", p1, onP1)
            NumberField("State 2 — W (kg/kg)", p2, onP2)
            NumberField("Mass flow m₁ (kg/s)", p3, onP3)
        }
    }
}

@Composable
private fun WOrRhToggle(useW: Boolean, onToggle: (Boolean) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        FilterChip(selected = !useW, onClick = { onToggle(false) }, label = { Text("By RH %") })
        FilterChip(selected = useW,  onClick = { onToggle(true) },  label = { Text("By W kg/kg") })
    }
}

@Composable
private fun NumberField(label: String, value: String, onValue: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValue,
        label = { Text(label) },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
    )
}

private fun secInputLabel(s: SecondaryInput) = when (s) {
    SecondaryInput.RH  -> "Relative Humidity"
    SecondaryInput.WBT -> "Wet-Bulb Temp"
    SecondaryInput.DPT -> "Dew-Point Temp"
    SecondaryInput.W   -> "Humidity Ratio"
    SecondaryInput.V   -> "Specific Volume"
}

private fun secInputUnit(s: SecondaryInput) = when (s) {
    SecondaryInput.RH  -> "%"
    SecondaryInput.WBT, SecondaryInput.DPT -> "°C"
    SecondaryInput.W   -> "kg/kg"
    SecondaryInput.V   -> "m³/kg"
}

private fun buildState(vm: MainViewModel, dbt: Double, sec: SecondaryInput, value: Double) =
    runCatching { vm.calculateState(dbt, sec, value) }.getOrNull()
        .let { vm.stateResult.value }
