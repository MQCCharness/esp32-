package com.zcode.foldtilt

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val PageBg = Color(0xFF0E1116)
private val CardBg = Color(0xFF181D26)

/**
 * 演示页：一整页常规内容。特效由外层 FoldTiltContainer 施加，
 * 页面内部不做任何特殊处理——这正是「把特效套到现有 UI 上」的效果。
 */
@Composable
fun DemoPage() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(PageBg)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 18.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text(
            "Fold Tilt",
            color = Color.White,
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "倾斜手机，内容像一块有惯性的平面跟随，滞后产生透视与景深模糊",
            color = Color(0xFF8A94A6),
            fontSize = 13.sp,
        )

        // 主视觉：渐变头图
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .clip(RoundedCornerShape(20.dp))
                .background(
                    Brush.linearGradient(
                        listOf(Color(0xFF5B7CFA), Color(0xFFB44BF0), Color(0xFFFF6B9D))
                    )
                ),
            contentAlignment = Alignment.BottomStart,
        ) {
            Column(Modifier.padding(18.dp)) {
                Text("虚拟平面", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.SemiBold)
                Text("与屏幕不平行 → 越远越模糊", color = Color(0xE6FFFFFF), fontSize = 13.sp)
            }
        }

        // 信息卡片
        Card(
            colors = CardDefaults.cardColors(containerColor = CardBg),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("工作原理", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "用陀螺仪读取设备姿态，虚拟平面以指数滞后跟随。两者夹角驱动 3D 透视，" +
                        "并按深度加权模糊——后退的一侧变糊，前倾的一侧保持锐利。",
                    color = Color(0xFFB6C0D0),
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                )
            }
        }

        // 色块网格：方便观察模糊方向
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            listOf(
                Color(0xFF4CAF50) to "左",
                Color(0xFFFFB300) to "中",
                Color(0xFFE53935) to "右",
            ).forEach { (c, t) ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(96.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(c),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(t, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // 细节文本卡片：模糊是否可辨，看小字
        Card(
            colors = CardDefaults.cardColors(containerColor = CardBg),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("清晰度基准", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                repeat(3) { i ->
                    Text(
                        "第 ${i + 1} 行小字：用于判断模糊半径是否足够明显，" +
                            "平放时应完全锐利，倾斜时远端应明显糊化。",
                        color = Color(0xFF98A2B3),
                        fontSize = 11.sp,
                        lineHeight = 16.sp,
                    )
                }
            }
        }

        // 触感提示
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(70.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFF1F2733)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                "试着左右倾斜手机",
                color = Color(0xFF7C8AA0),
                fontSize = 14.sp,
            )
        }

        Spacer(Modifier.height(90.dp)) // 给底部控制面板留出空间
    }
}
