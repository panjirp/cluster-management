import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role;

    if (token?.mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      // Bendahara diizinkan membuka: Sinyal Darurat & Review Bukti Pembayaran
      const bendaharaAllowed =
        role === "BENDAHARA" &&
        (pathname.startsWith("/admin/emergency") || pathname.startsWith("/admin/payment-proofs"));
      if (!bendaharaAllowed) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
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
    "/guest-passes/:path*",
    "/parcels/:path*",
    "/polls/:path*",
    "/gallery/:path*",
    "/change-password/:path*",
    "/profile/:path*",
    "/help/:path*",
  ],
};
