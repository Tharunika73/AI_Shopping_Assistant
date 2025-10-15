import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { addToWishlist } from "../store/wishlistSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { setShowAuthModal } from '../store/uiSlice';
import { addToCart } from '../store/cartSlice';
import { toast } from 'sonner';
import { 
  Search, 
  Star, 
  ShoppingCart, 
  Heart, 
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import api from '../utils/api';

const ProductsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'electronics',
    "men's clothing",
    "women's clothing",
    'jewelery'
  ];

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  useEffect(() => {
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (sortBy) params.set('sort', sortBy);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy, setSearchParams]);
const handleAddToWishlist = async (productId) => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    try {
      const result = await dispatch(addToWishlist({ product_id: productId })).unwrap();
      if (result.message === "Item already in wishlist") {
          toast.info('This item is already in your wishlist!');
      } else {
          toast.success('Added to wishlist!');
      }
    } catch (error) {
      toast.error('Failed to add to wishlist.');
    }
  };
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (minPrice) params.append('min_price', minPrice);
      if (maxPrice) params.append('max_price', maxPrice);
      if (sortBy && sortBy !== 'default') params.append('sort', sortBy);

      const response = await api.get(`/products?${params}`);
      setProducts(response.data.data || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      dispatch(setShowAuthModal(true));
      return;
    }

    try {
      await dispatch(addToCart({ product_id: productId, quantity: 1 })).unwrap();
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
    setCurrentPage(1);
  };


  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }


    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          data-testid="prev-page"
        >
          Previous
        </Button>
        
        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => setCurrentPage(page)}
            data-testid={`page-${page}`}
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          data-testid="next-page"
        >
          Next
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Products</h1>
            <p className="text-slate-600 mt-2">Discover amazing products with AI-powered search</p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mt-4 lg:mt-0"
            data-testid="toggle-filters"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className={`lg:col-span-1 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Search & Filter</h3>
              
              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <Label htmlFor="search">Search Products</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    data-testid="search-input"
                  />
                  <Button type="submit" size="icon" data-testid="search-button">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </form>

              {/* Category Filter */}
              <div className="mb-6">
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-2" data-testid="category-select">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <Label>Price Range</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    data-testid="min-price-input"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    data-testid="max-price-input"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="mt-2" data-testid="sort-select">
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Button onClick={fetchProducts} className="w-full" data-testid="apply-filters">
                  Apply Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="w-full"
                  data-testid="clear-filters"
                >
                  Clear All
                </Button>
              </div>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(12)].map((_, index) => (
                  <Card key={index} className="loading">
                    <div className="h-48 bg-slate-200 rounded-t-lg"></div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                      <div className="h-8 bg-slate-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Products Found</h3>
                <p className="text-slate-600 mb-4">Try adjusting your search criteria or filters</p>
                <Button onClick={clearFilters} data-testid="no-results-clear">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card 
                      key={product.id} 
                      className="card-hover overflow-hidden cursor-pointer group"
                      onClick={() => navigate(`/products/${product.id}`)}
                      data-testid={`product-${product.id}`}
                    >
                      <div className="relative">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.rating && (
                          <Badge className="absolute top-2 right-2 bg-white text-slate-900">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {product.rating.rate}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <Badge variant="secondary" className="mb-2">
                          {product.category}
                        </Badge>
                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                          {product.title}
                        </h3>
                        <p className="text-2xl font-bold text-blue-600 mb-3">
                          ${product.price}
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product.id);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            data-testid={`add-to-cart-${product.id}`}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                                                  variant="outline"
                                                  size="icon"
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleAddToWishlist(product.id);
                                                  }}
                                                  data-testid={`wishlist-btn-${product.id}`}
                                                >
                                                  <Heart className="w-4 h-4" />
                                                </Button>

                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;