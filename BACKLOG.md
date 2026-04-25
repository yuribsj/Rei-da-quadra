# Backlog — Rei da Quadra

## High Priority

### Push Notifications
- Notify players when invited to a championship
- Notify when a championship starts (schedule generated)
- Notify when a match result is registered
- Notify when a championship is finalized (champion revealed)
- Use Expo Notifications + Supabase `notifications` table

### Real-time Updates
- Subscribe to championship/match/result changes via Supabase Realtime
- Auto-refresh ranking, match cards, and player list without manual pull-to-refresh

### Result Confirmation Flow
- Require both pairs to confirm (or dispute) a registered result before it counts
- Show "pending confirmation" state on match cards
- Allow admin to override disputes

## Medium Priority

### Player Stats & Head-to-Head
- Detailed player profile with win/loss history per opponent
- Head-to-head record between two players
- Win streaks, best partner stats

### Championship History & Replay
- View full bracket/schedule of past championships
- Shareable championship summary card (image export)

### Improved Scheduling
- Allow admin to manually adjust generated schedule (swap matches)
- Support custom round dates/times
- Calendar integration for upcoming matches

### Admin Dashboard
- Overview of all championships the user administers
- Quick actions: start, finalize, cancel from one place
- Bulk invite via contact list or link sharing

### Dark/Light Theme Polish
- Complete dark mode support across all screens
- System theme auto-detection
- Animated theme transitions

## Low Priority

### Social Features
- In-app chat per championship (group chat)
- Player comments/reactions on match results
- Follow other players

### Onboarding & Tutorials
- First-time user walkthrough
- Tooltips explaining scoring system (3/2/1/0 pts)
- Sample championship for new users to explore

### Accessibility
- Screen reader support (a11y labels)
- Dynamic font scaling
- High-contrast mode

### Analytics & Insights
- Championship-level stats (most competitive match, biggest upset)
- Season-over-season performance trends
- Export data to CSV/PDF

### Additional Sports & Formats
- Support for other sports beyond padel/tennis
- Different tournament formats (elimination bracket, Swiss system)
- Customizable scoring rules per championship

### Offline Support
- Cache active championship data for offline viewing
- Queue result submissions when offline, sync when back online
