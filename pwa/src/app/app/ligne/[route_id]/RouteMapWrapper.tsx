'use client';

import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false });

type ShapePoint = { shape_pt_lat: number; shape_pt_lon: number };
type RouteStop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
};

type Props = {
  shape: ShapePoint[];
  stops: RouteStop[];
  routeColor?: string;
  activeDirection: number;
  isSegmented: boolean;
};

export default function RouteMapWrapper({ shape, stops, routeColor, activeDirection, isSegmented }: Props) {
  return <RouteMap shape={shape} stops={stops} routeColor={routeColor} activeDirection={activeDirection} isSegmented={isSegmented} />;\n}\n