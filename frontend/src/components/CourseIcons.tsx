import React from 'react';
import Svg, { Circle, Line, Polygon, Rect, Text as SvgText } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Four vertical pillars (Year / Month / Day / Hour), each carrying its
// character - a literal reading of BaZi's "Four Pillars of Destiny".
const PILLAR_CHARS = ['年', '月', '日', '時'];
const PILLAR_X = [2, 7.5, 13, 18.5];

export function BaziPillarsIcon({ size = 24, color = '#D4A93A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {PILLAR_X.map((x, i) => (
        <React.Fragment key={i}>
          <Rect
            x={x}
            y={4}
            width={4}
            height={16}
            rx={1}
            stroke={color}
            strokeWidth={1.3}
            fill="none"
          />
          <SvgText
            x={x + 2}
            y={13.5}
            fontSize={5.5}
            fill={color}
            textAnchor="middle"
          >
            {PILLAR_CHARS[i]}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

// The Wu Xing productive cycle, arranged pentagon-style: Wood -> Fire ->
// Earth -> Metal -> Water -> Wood, each edge tipped with an arrowhead
// pointing to the element it generates.
const CYCLE_NODES: [number, number][] = [
  [12, 4],
  [19.61, 9.53],
  [16.7, 18.47],
  [7.3, 18.47],
  [4.39, 9.53],
];

function edgeAngleDeg(a: [number, number], b: [number, number]) {
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
}

export function FiveElementsIcon({ size = 24, color = '#D4A93A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {CYCLE_NODES.map((node, i) => {
        const next = CYCLE_NODES[(i + 1) % CYCLE_NODES.length];
        const mx = (node[0] + next[0]) / 2;
        const my = (node[1] + next[1]) / 2;
        const angle = edgeAngleDeg(node, next);
        return (
          <React.Fragment key={i}>
            <Line
              x1={node[0]}
              y1={node[1]}
              x2={next[0]}
              y2={next[1]}
              stroke={color}
              strokeWidth={1.1}
            />
            <Polygon
              points="1.6,0 -1.1,-1.1 -1.1,1.1"
              fill={color}
              transform={`translate(${mx}, ${my}) rotate(${angle})`}
            />
          </React.Fragment>
        );
      })}
      {CYCLE_NODES.map((node, i) => (
        <Circle key={`n${i}`} cx={node[0]} cy={node[1]} r={2.1} fill={color} />
      ))}
    </Svg>
  );
}

export function GuaIcon({ size = 24, color = '#D4A93A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.4} fill="none" />
      <SvgText
        x={12}
        y={14.6}
        fontSize={6.3}
        fontWeight="bold"
        fill={color}
        textAnchor="middle"
      >
        GUA
      </SvgText>
    </Svg>
  );
}
