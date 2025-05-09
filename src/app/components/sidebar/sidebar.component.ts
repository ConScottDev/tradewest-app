import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

declare const $: any;
declare interface RouteInfo {
  path?: string;
  title: string;
  icon: string;
  class: string;
  children?: RouteInfo[]; // Optional for dropdowns
  expanded?: boolean; // Track if the menu is expanded
}

export const ROUTES: RouteInfo[] = [
  {
    path: "/invoices",
    title: "Invoices",
    icon: "description",
    class: "dropdown",
    expanded: false,
    children: [
      { path: "/invoices", title: "New Invoice", icon: "", class: "" },
      { path: "/invoices-list", title: "All Invoices", icon: "", class: "" },
    ],
  },
  {
    title: "Statements",
    icon: "task",
    class: "dropdown",
    expanded: false, // Default collapsed
    children: [
      { path: "/statements", title: "New Statement", icon: "", class: "" },
      {
        path: "/statements-list",
        title: "All Statements",
        icon: "",
        class: "",
      },
    ],
  },
  {
    title: "Quotes",
    icon: "receipt_long",
    class: "dropdown",
    expanded: false, // Default collapsed
    children: [
      { path: "/quotes", title: "New Quote", icon: "", class: "" },
      {
        path: "/quotes-list",
        title: "All Quotes",
        icon: "",
        class: "",
      },
    ],
  },
  { path: "/emails", title: "Emails", icon: "mail", class: "" }
];

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"],
})
export class SidebarComponent implements OnInit {
  menuItems: any[];

  constructor(private router: Router) {}

  ngOnInit() {
    this.menuItems = ROUTES.filter((menuItem) => menuItem);
  }
  isMobileMenu() {
    if ($(window).width() > 991) {
      return false;
    }
    return true;
  }

  isParentActive(menuItem: any): boolean {
    return this.router.url === menuItem.path; // Only active if exact match
  }

  isChildRouteActive(children: any[]): boolean {
    return children.some((child) => this.router.url.includes(child.path));
  }
}
