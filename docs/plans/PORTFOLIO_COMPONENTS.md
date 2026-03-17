# Portfolio Components (Refined Specs)

## VirtualGrid (TanStack)
```tsx
// Refined: 50+ panels, 60fps
const VirtualGrid = React.memo(({data}: {data: Metric[]}) => (
  <Virtualizer overscan={10}>
    {virtualItems.map(item => <MetricPanel key={item.key} {...data[item.index]} />)}
  </Virtualizer>
));
```

## TradingDashboard (VLR/HLTV Inspired, Trees/Worlds)
- Enterprise Polish: Match post-stats grid (HLTV radar + VLR ratings).
- Code: ```tsx // VLR-style player card + EV... ```
- Live Demo: vercel.app/portfolio

**Resources**: VLR/HLTV UI teardown.

