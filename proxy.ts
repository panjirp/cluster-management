import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (pathname.startsWith("/cash/transactions/new") && role !== "BENDAHARA") {
      return NextResponse.redirect(new URL("/cash", req.url));
    }

    if (pathname.startsWith("/events/new") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/events", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/complaints/:path*",
    "/permits/:path*",
    "/cash/:path*",
    "/admin/:path*",
    "/map/:path*",
    "/cctv/:path*",
    "/directory/:path*",
    "/events/:path*",
  ],
};
