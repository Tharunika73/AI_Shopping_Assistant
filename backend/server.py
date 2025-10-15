from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx
import asyncio
from jose import JWTError, jwt
import bcrypt
import json
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import pickle
# from emergentintegrations.llm.chat import LlmChat, UserMessage

# ADDED: Imports for sending email
import smtplib
from email.message import EmailMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="AI Shopping Backend", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# AI Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
model = None
embeddings_cache = {}

# Initialize sentence transformer model
def init_ai_model():
    global model
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("AI model loaded successfully")
    except Exception as e:
        print(f"Error loading AI model: {e}")

# Initialize AI on startup
@app.on_event("startup")
async def startup_event():
    await sync_products_from_api()
    init_ai_model()

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class Product(BaseModel):
    id: int
    title: str
    price: float
    description: str
    category: str
    image: str
    rating: dict

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: int
    quantity: int = 1
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemUpdate(BaseModel):
    product_id: int
    quantity: int

class WishlistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: int
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WishlistItemCreate(BaseModel):
    product_id: int

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[dict]
    total_amount: float
    status: str = "completed"
    shipping_address: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[dict]
    shipping_address: dict

class AIQueryRequest(BaseModel):
    query: str
    limit: int = 10

class AIQueryResponse(BaseModel):
    reply_text: str
    results: List[dict]

# ADDED: Pydantic model for the contact form request
class ContactFormRequest(BaseModel):
    name: str
    email: str
    message: str

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    token = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Sync products from Fake Store API
async def sync_products_from_api():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://fakestoreapi.com/products")
            if response.status_code == 200:
                products = response.json()
                
                # Clear existing products
                await db.products.delete_many({})
                
                # Insert new products
                for product in products:
                    await db.products.insert_one(product)
                
                print(f"Synced {len(products)} products from API")
                return True
            else:
                print(f"Failed to fetch products: {response.status_code}")
                return False
    except Exception as e:
        print(f"Error syncing products: {e}")
        return False

# AI Functions
def get_product_embeddings(products):
    if not model:
        return []
    
    texts = []
    for product in products:
        # Combine title, description, and category for embedding
        text = f"{product.get('title', '')} {product.get('description', '')} {product.get('category', '')}"
        texts.append(text)
    
    embeddings = model.encode(texts)
    return embeddings

async def semantic_search(query: str, limit: int = 10):
    try:
        if not model:
            raise Exception("AI model not initialized")
        
        # Get all products
        products = await db.products.find().to_list(length=None)
        if not products:
            return []
        
        # Get or create embeddings
        product_embeddings = get_product_embeddings(products)
        if len(product_embeddings) == 0:
            return []
        
        # Encode query
        query_embedding = model.encode([query])
        
        # Calculate similarities
        similarities = cosine_similarity(query_embedding, product_embeddings)[0]
        
        # Get top results
        top_indices = np.argsort(similarities)[::-1][:limit]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.1:  # Minimum threshold
                product = products[idx]
                results.append({
                    "product_id": product["id"],
                    "title": product["title"],
                    "price": product["price"],
                    "image": product["image"],
                    "category": product["category"],
                    "score": float(similarities[idx]),
                    "summary": f"Found {product['title']} in {product['category']} category for ${product['price']}"
                })
        
        return results
    except Exception as e:
        print(f"Error in semantic search: {e}")
        return []

async def generate_ai_response(query: str, search_results: List[dict]):
    try:
        if not EMERGENT_LLM_KEY:
            return "AI assistant is not configured."
        
        # Prepare context from search results
        context = ""
        if search_results:
            context = "Found these products:\n"
            for result in search_results[:5]:
                context += f"- {result['title']} (${result['price']}) in {result['category']}\n"
        
        # Create AI chat instance
        # chat = LlmChat(
        #     api_key=EMERGENT_LLM_KEY,
        #     session_id="shopping-assistant",
        #     system_message="You are a helpful shopping assistant. Help users find products they're looking for. Be friendly and concise."
        # ).with_model("openai", "gpt-4o")
        
        # # Prepare user message
        # user_text = f"User query: {query}\n\nAvailable products:\n{context}\n\nProvide a helpful response about the products found."
        
        # user_message = UserMessage(text=user_text)
        # response = await chat.send_message(user_message)
        
        # return response if response else "I'm here to help you find products!"
        
        # Placeholder response since LlmChat is commented out
        if search_results:
            return f"I found a few items for you based on '{query}', including {search_results[0]['title']}."
        else:
            return f"I couldn't find any products matching '{query}', but I'm here to help you find other items!"

    except Exception as e:
        print(f"Error generating AI response: {e}")
        return "I'm here to help you find products!"

# --- ALL YOUR EXISTING ROUTES (Auth, Products, Cart, etc.) ARE UNCHANGED ---

# Authentication Routes
@api_router.post("/auth/register", response_model=dict)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = hash_password(user_data.password)
    user = User(name=user_data.name, email=user_data.email, password_hash=hashed_password)
    await db.users.insert_one(user.dict())
    access_token = create_access_token(data={"sub": user.id})
    return {"user": UserResponse(**user.dict()), "access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=dict)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user["id"]})
    return {"user": UserResponse(**user), "access_token": access_token, "token_type": "bearer"}

# ADDED: New route for handling contact form submission
@api_router.post("/contact", response_model=dict)
async def handle_contact_form(form_data: ContactFormRequest):
    # --- Email Configuration ---
    SENDER_EMAIL = os.environ.get("MAIL_USERNAME")
    SENDER_PASSWORD = os.environ.get("MAIL_PASSWORD")
    RECIPIENT_EMAIL = "projectfeedbackform@gmail.com"

    if not SENDER_EMAIL or not SENDER_PASSWORD:
        logging.error("Mail credentials not found in .env file.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server mail configuration is incomplete."
        )

    # --- Construct the Email ---
    msg = EmailMessage()
    msg['Subject'] = f"New Contact Form Message from {form_data.name}"
    msg['From'] = SENDER_EMAIL
    msg['To'] = RECIPIENT_EMAIL
    
    email_body = f"""
    You have received a new message from your website's contact form.
    
    Name: {form_data.name}
    Email: {form_data.email}
    
    Message:
    {form_data.message}
    """
    msg.set_content(email_body)

    # --- Send the Email ---
    try:
        # smtplib is a blocking library. In a high-concurrency production app,
        # you would run this in a separate thread pool to avoid blocking the event loop.
        # For this project, direct execution is acceptable.
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(SENDER_EMAIL, SENDER_PASSWORD)
            smtp.send_message(msg)
        
        return {"message": "Message sent successfully!"}
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message. Please try again later."
        )

# Product Routes
@api_router.get("/products", response_model=dict)
async def get_products(page: int = 1, limit: int = 20, search: str = None, category: str = None, min_price: float = None, max_price: float = None, sort: str = None):
    skip = (page - 1) * limit
    filter_query = {}
    if search:
        filter_query["$or"] = [{"title": {"$regex": search, "$options": "i"}}, {"description": {"$regex": search, "$options": "i"}}]
    if category:
        filter_query["category"] = {"$regex": category, "$options": "i"}
    if min_price is not None or max_price is not None:
        price_filter = {}
        if min_price is not None: price_filter["$gte"] = min_price
        if max_price is not None: price_filter["$lte"] = max_price
        filter_query["price"] = price_filter
    total = await db.products.count_documents(filter_query)
    sort_criteria = [("price", 1)] if sort == "price_asc" else [("price", -1)] if sort == "price_desc" else [("rating.rate", -1)] if sort == "rating" else [("id", 1)]
    products = await db.products.find(filter_query).sort(sort_criteria).skip(skip).limit(limit).to_list(length=limit)
    for product in products:
        if '_id' in product: del product['_id']
    return {"data": products, "total": total, "page": page, "limit": limit, "pages": (total + limit - 1) // limit}

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: int):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if '_id' in product: del product['_id']
    return Product(**product)

# --- Cart, Wishlist, Orders, AI, Admin, and Test Routes are all unchanged ---

# Cart Routes
@api_router.get("/cart", response_model=dict)
async def get_cart(current_user: User = Depends(get_current_user)):
    cart_items = await db.cart_items.find({"user_id": current_user.id}).to_list(length=None)
    items, subtotal = [], 0
    for cart_item in cart_items:
        product = await db.products.find_one({"id": cart_item["product_id"]})
        if product:
            if '_id' in product: del product['_id']
            item_total = product["price"] * cart_item["quantity"]
            items.append({"id": cart_item["id"], "product": product, "quantity": cart_item["quantity"], "item_total": item_total})
            subtotal += item_total
    return {"items": items, "subtotal": subtotal}

@api_router.post("/cart", response_model=dict)
async def add_to_cart(item_data: CartItemCreate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": item_data.product_id})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    existing_item = await db.cart_items.find_one({"user_id": current_user.id, "product_id": item_data.product_id})
    if existing_item:
        new_quantity = existing_item["quantity"] + item_data.quantity
        await db.cart_items.update_one({"_id": existing_item["_id"]}, {"$set": {"quantity": new_quantity}})
    else:
        cart_item = CartItem(user_id=current_user.id, product_id=item_data.product_id, quantity=item_data.quantity)
        await db.cart_items.insert_one(cart_item.dict())
    return {"message": "Item added to cart"}

@api_router.put("/cart", response_model=dict)
async def update_cart_item(item_data: CartItemUpdate, current_user: User = Depends(get_current_user)):
    result = await db.cart_items.update_one({"user_id": current_user.id, "product_id": item_data.product_id}, {"$set": {"quantity": item_data.quantity}})
    if result.modified_count == 0: raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Cart updated"}

@api_router.delete("/cart/{product_id}", response_model=dict)
async def remove_from_cart(product_id: int, current_user: User = Depends(get_current_user)):
    result = await db.cart_items.delete_one({"user_id": current_user.id, "product_id": product_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Item removed from cart"}

# Wishlist Routes
@api_router.get("/wishlist", response_model=dict)
async def get_wishlist(current_user: User = Depends(get_current_user)):
    wishlist_items = await db.wishlist_items.find({"user_id": current_user.id}).to_list(length=None)
    items = []
    for wishlist_item in wishlist_items:
        product = await db.products.find_one({"id": wishlist_item["product_id"]})
        if product:
            if '_id' in product: del product['_id']
            items.append({"id": wishlist_item["id"], "product": product, "added_at": wishlist_item["added_at"]})
    return {"items": items}

@api_router.post("/wishlist", response_model=dict)
async def add_to_wishlist(item_data: WishlistItemCreate, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": item_data.product_id})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    existing_item = await db.wishlist_items.find_one({"user_id": current_user.id, "product_id": item_data.product_id})
    if existing_item: return {"message": "Item already in wishlist"}
    wishlist_item = WishlistItem(user_id=current_user.id, product_id=item_data.product_id)
    await db.wishlist_items.insert_one(wishlist_item.dict())
    return {"message": "Item added to wishlist"}

@api_router.delete("/wishlist/{product_id}", response_model=dict)
async def remove_from_wishlist(product_id: int, current_user: User = Depends(get_current_user)):
    result = await db.wishlist_items.delete_one({"user_id": current_user.id, "product_id": product_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Wishlist item not found")
    return {"message": "Item removed from wishlist"}

# Orders Routes
@api_router.post("/orders/checkout", response_model=dict)
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    cart_items = await db.cart_items.find({"user_id": current_user.id}).to_list(length=None)
    if not cart_items: raise HTTPException(status_code=400, detail="Cart is empty")
    order_items, total_amount = [], 0
    for cart_item in cart_items:
        product = await db.products.find_one({"id": cart_item["product_id"]})
        if product:
            item_total = product["price"] * cart_item["quantity"]
            order_items.append({"product_id": cart_item["product_id"], "title": product["title"], "price": product["price"], "quantity": cart_item["quantity"], "item_total": item_total})
            total_amount += item_total
    order = Order(user_id=current_user.id, items=order_items, total_amount=total_amount, shipping_address=order_data.shipping_address)
    await db.orders.insert_one(order.dict())
    await db.cart_items.delete_many({"user_id": current_user.id})
    return {"order": order.dict(), "message": "Order placed successfully"}

@api_router.get("/orders", response_model=dict)
async def get_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.id}).sort([("created_at", -1)]).to_list(length=None)
    for order in orders:
        if '_id' in order: del order['_id']
    return {"orders": orders}

# AI Routes
@api_router.post("/ai/query", response_model=AIQueryResponse)
async def ai_query(query_data: AIQueryRequest, current_user: User = Depends(get_current_user)):
    try:
        search_results = await semantic_search(query_data.query, query_data.limit)
        reply_text = await generate_ai_response(query_data.query, search_results)
        return AIQueryResponse(reply_text=reply_text, results=search_results)
    except Exception as e:
        print(f"Error in AI query: {e}")
        return AIQueryResponse(reply_text="I'm sorry, I'm having trouble processing your request right now.", results=[])

# Admin Routes
@api_router.post("/admin/sync-products", response_model=dict)
async def sync_products():
    success = await sync_products_from_api()
    if success:
        return {"message": "Products synced successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to sync products")

# Test Routes
@api_router.get("/")
async def root():
    return {"message": "AI Shopping Backend API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)