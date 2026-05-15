import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function SparklineChart({ data = [], height = 50, color = '#1D9E75' }) {
  if (!data || data.length < 2) return null;

  const p = 4;
  const w = 300;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (w - p * 2) / (data.length - 1);

  const xs = data.map((_, i) => p + i * step);
  const ys = data.map(v => height - p - ((v - min) / range) * (height - p * 2));

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${xs[xs.length - 1].toFixed(1)} ${height} L ${xs[0].toFixed(1)} ${height} Z`;

  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];

  return (
    <View style={{ height, width: '100%' }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#sparkFill)" />
        <Path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={lastX} cy={lastY} r="3.5" fill={color} />
        <Circle cx={lastX} cy={lastY} r="6" fill={color} opacity="0.25" />
      </Svg>
    </View>
  );
}
