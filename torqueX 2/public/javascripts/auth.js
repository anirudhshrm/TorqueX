/**
 * Client-side authentication handling
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth script loaded');
  
  // Function to initialize Clerk features
  function initClerk() {
    if (!window.Clerk) {
      console.warn('Clerk not available');
      return;
    }
    
    console.log('Setting up Clerk authentication components');
    
    // Handle sign out buttons
    const signOutButtons = document.querySelectorAll('.sign-out-btn');
    signOutButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        if (window.Clerk.user) {
          window.Clerk.signOut().then(() => {
            window.location.href = '/auth/logout';
          });
        } else {
          window.location.href = '/auth/logout';
        }
      });
    });
    
    // Update UI with user info if available
    if (window.Clerk.user) {
      const userDisplayElements = document.querySelectorAll('.user-display-name');
      userDisplayElements.forEach(element => {
        const firstName = window.Clerk.user.firstName || '';
        const lastName = window.Clerk.user.lastName || '';
        element.textContent = `${firstName} ${lastName}`.trim() || 'User';
      });
    }
  }
  
  // Try to initialize immediately if Clerk is already loaded
  if (window.Clerk && window.Clerk.user) {
    initClerk();
  }
  
  // Also listen for the clerkLoaded event from header.ejs
  document.addEventListener('clerkLoaded', function() {
    console.log('Clerk loaded event received');
    initClerk();
  });
  
  // Handle Clerk initialization failures
  document.addEventListener('clerkFailed', function() {
    console.log('Clerk failed event received - using fallback authentication');
    // Use traditional auth instead (session-based auth)
    const signOutButtons = document.querySelectorAll('.sign-out-btn');
    signOutButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '/auth/logout';
      });
    });
    setTimeout(initClerk, 500); // Small delay to ensure Clerk is fully initialized
  });
});