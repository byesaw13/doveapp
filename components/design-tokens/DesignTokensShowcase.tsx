'use client';

import {
  getSpacing,
  getColor,
  getBorderRadius,
  getShadow,
  getFontSize,
  spacing,
  colors,
  typography,
  shadows,
  borderRadius,
  cssVars,
} from '@/lib/design-tokens-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function DesignTokensShowcase() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Design Tokens Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Spacing Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Spacing Scale</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(spacing).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center space-x-2 bg-muted p-2 rounded"
                  style={{ marginRight: value }}
                >
                  <Badge variant="outline">{key}</Badge>
                  <span className="text-sm">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Color Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Color Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(colors.primary)
                .slice(0, 6)
                .map(([shade, color]) => (
                  <div key={shade} className="text-center">
                    <div
                      className="h-12 w-full rounded mb-2 border"
                      style={{ backgroundColor: color }}
                    />
                    <Badge variant="outline" className="text-xs">
                      primary-{shade}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>

          {/* Typography Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Typography Scale</h3>
            <div className="space-y-2">
              {Object.entries(typography.fontSize)
                .slice(0, 5)
                .map(([size, value]) => (
                  <div key={size} style={{ fontSize: value }}>
                    {size}: The quick brown fox jumps over the lazy dog
                  </div>
                ))}
            </div>
          </div>

          {/* Border Radius Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Border Radius</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(borderRadius)
                .slice(0, 4)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-primary text-primary-foreground p-4 text-sm"
                    style={{ borderRadius: value }}
                  >
                    {key}: {value}
                  </div>
                ))}
            </div>
          </div>

          {/* Shadow Examples */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Shadows</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(shadows)
                .slice(0, 3)
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-card p-4 rounded text-sm border"
                    style={{ boxShadow: value }}
                  >
                    {key}
                  </div>
                ))}
            </div>
          </div>

          {/* CSS Variables Usage */}
          <div>
            <h3 className="text-lg font-semibold mb-3">CSS Variables in Use</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-card p-3 rounded border">
                <div className="font-medium">Background</div>
                <div
                  style={{ backgroundColor: cssVars.background }}
                  className="h-6 w-full rounded mt-1 border"
                />
              </div>
              <div className="bg-card p-3 rounded border">
                <div className="font-medium">Primary</div>
                <div
                  style={{ backgroundColor: cssVars.primary }}
                  className="h-6 w-full rounded mt-1 border"
                />
              </div>
              <div className="bg-card p-3 rounded border">
                <div className="font-medium">Secondary</div>
                <div
                  style={{ backgroundColor: cssVars.secondary }}
                  className="h-6 w-full rounded mt-1 border"
                />
              </div>
              <div className="bg-card p-3 rounded border">
                <div className="font-medium">Accent</div>
                <div
                  style={{ backgroundColor: cssVars.accent }}
                  className="h-6 w-full rounded mt-1 border"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
