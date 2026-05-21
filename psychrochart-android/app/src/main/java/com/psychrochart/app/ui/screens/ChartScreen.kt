package com.psychrochart.app.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CenterFocusStrong
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*
import androidx.compose.ui.unit.dp
import com.psychrochart.app.domain.PsychroCalc
import com.psychrochart.app.domain.PsychroState
import com.psychrochart.app.ui.theme.*
import com.psychrochart.app.viewmodel.MainViewModel

private const val DBT_MIN = -10.0
private const val DBT_MAX = 50.0
private const val W_MIN   = 0.0
private const val W_MAX   = 0.030

@Composable
fun ChartScreen(vm: MainViewModel) {
    val plottedStates by vm.plottedStates.collectAsState()

    var scale      by remember { mutableFloatStateOf(1f) }
    var offset     by remember { mutableStateOf(Offset.Zero) }

    val transformState = rememberTransformableState { zoomChange, panChange, _ ->
        scale  = (scale * zoomChange).coerceIn(0.8f, 8f)
        offset = Offset(offset.x + panChange.x, offset.y + panChange.y)
    }

    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {

        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .transformable(transformState)
                .graphicsLayer(scaleX = scale, scaleY = scale, translationX = offset.x, translationY = offset.y)
        ) {
            val w = size.width
            val h = size.height

            val pad = Offset(60f, 30f)
            val plotW = w - pad.x - 20f
            val plotH = h - pad.y - 50f

            fun toX(dbt: Double) = (pad.x + ((dbt - DBT_MIN) / (DBT_MAX - DBT_MIN)) * plotW).toFloat()
            fun toY(humidity: Double) = (pad.y + plotH - ((humidity - W_MIN) / (W_MAX - W_MIN)) * plotH).toFloat()

            // Background
            drawRect(Color(0xFFF5F8FC), topLeft = Offset(pad.x, pad.y), size = androidx.compose.ui.geometry.Size(plotW, plotH))

            // Grid lines
            for (t in -10..50 step 5) {
                val x = toX(t.toDouble())
                drawLine(Color.Gray.copy(alpha = 0.2f), Offset(x, pad.y), Offset(x, pad.y + plotH), 1f)
            }
            for (i in 0..6) {
                val wVal = i * 0.005
                val y = toY(wVal)
                drawLine(Color.Gray.copy(alpha = 0.2f), Offset(pad.x, y), Offset(pad.x + plotW, y), 1f)
            }

            // Constant RH lines (10%–90%)
            for (rhInt in 10..90 step 10) {
                val rh = rhInt / 100.0
                val pts = PsychroCalc.constantRhCurve(rh).points
                drawChartPath(pts, ChartRH.copy(alpha = 0.5f), 2f, ::toX, ::toY)
            }

            // Saturation curve
            val satPts = PsychroCalc.saturationCurve().points
            drawChartPath(satPts, ChartSaturation, 4f, ::toX, ::toY)

            // Constant WBT lines
            for (wbt in -5..30 step 5) {
                val pts = PsychroCalc.constantWbtCurve(wbt.toDouble()).points
                drawChartPath(pts, ChartWBT.copy(alpha = 0.4f), 1.5f, ::toX, ::toY, dashInterval = 15f)
            }

            // Constant enthalpy lines
            for (hKj in -10..120 step 10) {
                val pts = PsychroCalc.constantEnthalpyCurve(hKj.toDouble()).points
                drawChartPath(pts, ChartEnthalpy.copy(alpha = 0.3f), 1f, ::toX, ::toY, dashInterval = 10f)
            }

            // Constant specific volume lines
            for (vVal in listOf(0.80, 0.84, 0.88, 0.92)) {
                val pts = PsychroCalc.constantSpecVolCurve(vVal).points
                drawChartPath(pts, ChartSpecVol.copy(alpha = 0.35f), 1f, ::toX, ::toY, dashInterval = 8f)
            }

            // Axes border
            drawRect(Color(0xFF2C3E50), topLeft = Offset(pad.x, pad.y),
                size = androidx.compose.ui.geometry.Size(plotW, plotH), style = Stroke(2f))

            // State points
            plottedStates.forEachIndexed { i, ps ->
                val col = PointColors[i % PointColors.size]
                val cx  = toX(ps.state.dbt)
                val cy  = toY(ps.state.w)
                drawCircle(col, 14f, Offset(cx, cy))
                drawCircle(Color.White, 6f, Offset(cx, cy))
            }
        }

        // Overlay: legend + controls
        Column(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(8.dp)
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.92f), RoundedCornerShape(8.dp))
                .padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            LegendRow(ChartSaturation, "Saturation (100% RH)")
            LegendRow(ChartRH, "Const. RH")
            LegendRow(ChartWBT, "Const. WBT")
            LegendRow(ChartEnthalpy, "Const. Enthalpy")
            LegendRow(ChartSpecVol, "Const. Sp. Volume")
        }

        // Plotted state labels
        if (plottedStates.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(8.dp)
                    .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.92f), RoundedCornerShape(8.dp))
                    .padding(8.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                plottedStates.forEachIndexed { i, ps ->
                    val col = PointColors[i % PointColors.size]
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(10.dp).background(col, RoundedCornerShape(50)))
                        Text(
                            "${ps.label}: DBT=${ps.state.dbt}°C  W=${ps.state.w}  RH=${ps.state.rh}%",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }
        }

        // FABs
        Column(
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (plottedStates.isNotEmpty()) {
                SmallFloatingActionButton(onClick = { vm.clearPlottedStates() }) {
                    Icon(Icons.Default.DeleteSweep, "Clear points")
                }
            }
            FloatingActionButton(onClick = { scale = 1f; offset = Offset.Zero }) {
                Icon(Icons.Default.CenterFocusStrong, "Reset zoom")
            }
        }
    }
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

private fun DrawScope.drawChartPath(
    points: List<Pair<Double, Double>>,
    color: Color,
    strokeWidth: Float,
    toX: (Double) -> Float,
    toY: (Double) -> Float,
    dashInterval: Float = 0f,
) {
    if (points.size < 2) return
    val path = Path().apply {
        moveTo(toX(points[0].first), toY(points[0].second))
        for (i in 1 until points.size) {
            lineTo(toX(points[i].first), toY(points[i].second))
        }
    }
    val style: DrawStyle = if (dashInterval > 0f)
        Stroke(width = strokeWidth, pathEffect = PathEffect.dashPathEffect(floatArrayOf(dashInterval, dashInterval)))
    else
        Stroke(width = strokeWidth)
    drawPath(path, color, style = style)
}

@Composable
private fun LegendRow(color: Color, label: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(10.dp).background(color, RoundedCornerShape(2.dp)))
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface)
    }
}
