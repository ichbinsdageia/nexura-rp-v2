import {
  bindRouter,
  renderRoute,
} from './router.js?v=20260907-legal';


/* =========================================================
   NEXURA WEBSITE START
========================================================= */

/*
  Router aktivieren:
  - interne Navigation
  - Browser Vor/Zurück
*/
bindRouter();


/*
  Aktuelle Seite laden.
*/
renderRoute();
