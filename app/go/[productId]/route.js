import { NextResponse } from "next/server";
import products from "@/data/products.json";
import { getSupabaseAdmin } from "@/lib/supabase/server";
export async function GET(request,{params}){const {productId}=await params;const product=products.find(p=>p.id===productId);if(!product)return NextResponse.redirect(new URL("/products",request.url));try{const admin=getSupabaseAdmin();const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");let userId=null;if(token){const {data:{user}}=await admin.auth.getUser(token);userId=user?.id||null;}await admin.from("clicks").insert({user_id:userId,product_id:product.id});}catch(error){console.error("Click logging error",error);}return NextResponse.redirect(product.affiliate_url,302);}
