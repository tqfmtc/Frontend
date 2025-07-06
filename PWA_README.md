# Mohalla Tuition Center - Progressive Web App (PWA)

This application has been converted into a Progressive Web App (PWA) that can be installed on mobile devices and used offline.

## Features

- **Installable**: Can be added to home screen on mobile devices
- **Offline Support**: Basic functionality works without internet connection
- **Responsive Design**: Optimized for mobile devices
- **Fast Loading**: Cached resources for better performance
- **Background Sync**: Syncs data when connection is restored

## Installation Instructions

### For Android Users (Chrome/Edge):
1. Open the app in Chrome or Edge browser
2. Tap the three-dot menu (⋮) in the top right
3. Select "Add to Home screen" or "Install app"
4. Follow the prompts to install
5. The app will appear on your home screen

### For iPhone Users (Safari):
1. Open the app in Safari browser
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm
5. The app will appear on your home screen

### For Desktop Users (Chrome/Edge):
1. Open the app in Chrome or Edge browser
2. Look for the install icon (📱) in the address bar
3. Click the install icon
4. Follow the prompts to install
5. The app will open in a standalone window

## PWA Features

### Offline Functionality
- The app caches essential resources for offline use
- Basic navigation and UI elements work without internet
- Data syncs when connection is restored

### Mobile Optimizations
- Touch-friendly interface with proper button sizes
- Responsive design that adapts to screen size
- Optimized for portrait orientation
- Prevents zoom on input focus

### Performance
- Fast loading with cached resources
- Background updates when new versions are available
- Efficient caching strategy for fonts and static assets

## Development

### Building for Production
```bash
npm run build
```

### Testing PWA Features
1. Build the project: `npm run build`
2. Serve the build folder: `npm run preview`
3. Open in Chrome and check DevTools > Application tab
4. Test install prompt and offline functionality

### PWA Configuration Files
- `public/manifest.json` - App manifest for installation
- `public/sw.js` - Service worker for offline functionality
- `vite.config.js` - PWA plugin configuration
- `src/utils/pwa.js` - PWA utility functions
- `src/components/PWAInstallPrompt.jsx` - Install prompt component

## Browser Support

- Chrome 67+
- Edge 79+
- Firefox 67+
- Safari 11.1+ (iOS 11.3+)
- Samsung Internet 7.2+

## Troubleshooting

### App Not Installing
- Ensure you're using a supported browser
- Check that the site is served over HTTPS (required for PWA)
- Clear browser cache and try again

### Offline Not Working
- Check if service worker is registered in DevTools > Application
- Verify cache is populated in DevTools > Application > Storage
- Try refreshing the page

### Updates Not Showing
- The app checks for updates automatically
- You'll be prompted to reload when a new version is available
- You can also manually check for updates by refreshing

## Security Notes

- PWA requires HTTPS in production
- Service worker has limited access to sensitive data
- All API calls still go through your existing backend
- No backend logic has been modified

## Customization

### Changing App Icon
Replace `src/assets/favicon-logo.png` with your desired icon (recommended sizes: 192x192, 512x512)

### Updating App Name
Edit the `name` and `short_name` fields in `public/manifest.json`

### Modifying Cache Strategy
Update the `runtimeCaching` configuration in `vite.config.js`

## Support

For technical support or questions about the PWA implementation, please refer to the main project documentation or contact the development team. 