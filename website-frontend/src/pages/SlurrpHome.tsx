import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const SlurrpHome = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      title: "Yummy & Healthy Meals!",
      subtitle: "Made by two mothers, loved by all kids.",
      bgColor: "bg-[#F7B3D7]"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      title: "Zero Maida, 100% Joy",
      subtitle: "Discover our range of millet pancakes and cereals.",
      bgColor: "bg-[#9BBED9]"
    }
  ];

  const categories = [
    { id: 1, name: "Bestsellers", icon: "✨", color: "bg-[#F8BE15]" },
    { id: 2, name: "Cereals", icon: "🥣", color: "bg-[#F7B3D7]" },
    { id: 3, name: "Pancakes", icon: "🥞", color: "bg-[#FFBC7A]" },
    { id: 4, name: "Snacks", icon: "🍪", color: "bg-[#9BBED9]" },
    { id: 5, name: "Combos", icon: "🎁", color: "bg-[#FDC11C]" },
  ];

  const products = [
    {
      id: 1,
      name: "Chocolate Millet Pancake Mix",
      price: 299,
      originalPrice: 350,
      image: "https://images.unsplash.com/photo-1506084868230-bb9ed95092da?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      badge: "Bestseller",
      bgColor: "bg-[#F7B3D7]",
      rating: 4.8,
      reviews: 124
    },
    {
      id: 2,
      name: "Strawberry Crunch Cereal",
      price: 349,
      originalPrice: 400,
      image: "https://images.unsplash.com/photo-1504306559907-fb1a4faae628?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      badge: "New",
      bgColor: "bg-[#9BBED9]",
      rating: 4.9,
      reviews: 89
    },
    {
      id: 3,
      name: "Oats & Honey Cookies",
      price: 199,
      originalPrice: 250,
      image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      badge: "Healthy",
      bgColor: "bg-[#FFBC7A]",
      rating: 4.7,
      reviews: 210
    },
    {
      id: 4,
      name: "Millet Noodles - Masala",
      price: 149,
      originalPrice: 180,
      image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      badge: "Must Try",
      bgColor: "bg-[#FDC11C]",
      rating: 4.6,
      reviews: 156
    }
  ];

  const exploreGrid = [
    { title: "For the Little Ones", image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", color: "bg-[#F7B3D7]", span: "col-span-1" },
    { title: "Healthy Snacking", image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80", color: "bg-[#9BBED9]", span: "col-span-1" },
    { title: "Breakfast Heroes", image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", color: "bg-[#FFBC7A]", span: "col-span-1 md:col-span-2" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen bg-[#FFF9F2] font-['Nunito',sans-serif] text-[#121212BF]">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Londrina+Solid:wght@300;400;900&family=Nunito:wght@400;600;700;800&display=swap');
          
          .font-title {
            font-family: 'Londrina Solid', cursive;
          }
          
          .blob-shape-1 { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          .blob-shape-2 { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      <div className="bg-[#F8BE15] text-black text-center py-2 px-4 font-bold text-sm tracking-wide sticky top-0 z-50">
        🎉 FREE DELIVERY ON ALL ORDERS ABOVE ₹499! USE CODE: SLURVP 🎉
      </div>

      <header className="bg-white py-4 px-6 md:px-12 flex items-center justify-between shadow-sm sticky top-[36px] z-40">
        <div className="flex items-center gap-4">
          <button className="md:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden md:flex gap-6 font-bold text-[#121212]">
            <Link to="/categories" className="text-[#C32025]">Shop</Link>
            <Link to="#" className="hover:text-[#C32025] transition-colors">Our Story</Link>
            <Link to="#" className="hover:text-[#C32025] transition-colors">Recipes</Link>
          </div>
        </div>

        <div className="text-3xl md:text-5xl font-title text-[#C32025] tracking-wider font-black">
          SLURRP!
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search for yummy health..." 
              className="bg-transparent outline-none text-sm w-48"
            />
          </div>
          <button className="md:hidden">
            <Search className="w-6 h-6" />
          </button>
          <button className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-[#C32025] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
              2
            </span>
          </button>
        </div>
      </header>

      <section className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div 
            key={slide.id}
            className={"absolute inset-0 transition-opacity duration-1000 " + (index === currentSlide ? "opacity-100" : "opacity-0") + " " + slide.bgColor + " flex flex-col md:flex-row items-center"}
          >
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center h-full z-10">
              <h1 className="font-title text-6xl md:text-8xl text-white mb-4 leading-none transform -rotate-2">
                {slide.title}
              </h1>
              <p className="text-xl md:text-3xl text-white/90 font-bold mb-8 max-w-lg">
                {slide.subtitle}
              </p>
              <Link to="/categories">
                <button className="bg-[#C32025] text-white font-black text-xl px-10 py-5 rounded-full w-max hover:scale-105 hover:shadow-xl transition-all shadow-lg transform rotate-1">
                  SHOP NOW
                </button>
              </Link>
            </div>
            <div className="w-full md:w-1/2 h-full absolute md:relative inset-0 opacity-40 md:opacity-100">
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="w-full h-full object-cover rounded-tl-[100px] rounded-bl-[100px]"
              />
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
          {heroSlides.map((_, index) => (
            <button 
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={"w-3 h-3 rounded-full transition-all " + (index === currentSlide ? "bg-white scale-150" : "bg-white/50")}
            />
          ))}
        </div>
      </section>

      <section className="py-8 px-4 md:px-12 -mt-6 relative z-30">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {categories.map(cat => (
            <div 
              key={cat.id} 
              className={cat.color + " min-w-[120px] md:min-w-[150px] flex flex-col items-center justify-center p-4 rounded-3xl shadow-sm hover:-translate-y-2 hover:shadow-md transition-all cursor-pointer border-4 border-white"}
            >
              <span className="text-4xl mb-2">{cat.icon}</span>
              <span className="font-bold text-sm md:text-base text-black">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="font-title text-5xl md:text-7xl text-[#C32025] mb-2 transform -rotate-1">Trending Now</h2>
            <p className="text-xl font-bold text-gray-600">Loved by kids, approved by moms!</p>
          </div>
          <button className="hidden md:flex font-black text-[#C32025] items-center hover:underline">
            View All <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map(product => (
            <div key={product.id} className="relative group bg-white rounded-[2rem] p-3 md:p-4 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="absolute top-4 left-4 z-10 bg-white px-3 py-1 rounded-full text-xs font-black text-[#C32025] shadow-md">
                {product.badge}
              </div>
              
              <div className={product.bgColor + " w-full aspect-square rounded-[1.5rem] mb-4 overflow-hidden relative p-4 flex items-center justify-center blob-shape-1 group-hover:blob-shape-2 transition-all duration-500"}>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500 shadow-md"
                />
              </div>

              <div className="px-2">
                <div className="flex items-center gap-1 mb-2 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-xs font-bold text-gray-600">{product.rating} ({product.reviews})</span>
                </div>
                <h3 className="font-bold text-[#121212] text-sm md:text-lg mb-2 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-black text-xl text-[#C32025]">₹{product.price}</span>
                  <span className="text-sm text-gray-400 line-through font-semibold">₹{product.originalPrice}</span>
                </div>
                
                <button className="w-full bg-[#121212] hover:bg-[#C32025] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                  <span>ADD TO CART</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 md:px-12 max-w-7xl mx-auto">
        <h2 className="font-title text-5xl md:text-7xl text-[#121212] mb-8 text-center rotate-1">Explore More Goodness</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exploreGrid.map((item, index) => (
            <div key={index} className={item.span + " " + item.color + " rounded-[2rem] overflow-hidden relative group h-64 md:h-80 cursor-pointer shadow-sm hover:shadow-lg transition-all"}>
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 mix-blend-multiply"
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-t from-black/60 to-transparent">
                <h3 className="font-title text-4xl md:text-6xl text-white mb-2">{item.title}</h3>
                <button className="bg-white text-black font-black w-max px-6 py-2 rounded-full text-sm hover:scale-105 transition-transform">
                  EXPLORE {'>'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#9BBED9] pt-16 pb-8 px-4 md:px-12 mt-12 overflow-hidden relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="md:w-1/3">
            <div className="text-5xl font-title text-white mb-4 transform -rotate-2">SLURRP!</div>
            <p className="text-white font-bold text-lg mb-6">Made by two mothers with love, for your little ones.</p>
            <div className="flex gap-4 justify-center md:justify-start">
              {['No Maida', 'No Junk', '100% Real'].map(badge => (
                <div key={badge} className="bg-white text-[#9BBED9] font-black text-xs px-3 py-1 rounded-full uppercase">
                  {badge}
                </div>
              ))}
            </div>
          </div>
          <div className="md:w-1/3 flex flex-col items-center border-y-2 md:border-y-0 md:border-x-2 border-white/30 py-8 md:py-0">
            <h3 className="font-title text-3xl text-white mb-4">Join the club!</h3>
            <div className="flex w-full max-w-sm">
              <input 
                type="email" 
                placeholder="Enter email..." 
                className="rounded-l-full px-4 py-3 outline-none flex-grow font-bold text-sm"
              />
              <button className="bg-[#C32025] text-white font-black px-6 rounded-r-full hover:bg-black transition-colors">
                GO!
              </button>
            </div>
          </div>
          <div className="md:w-1/4">
            <p className="text-white/80 font-bold text-sm mb-2">Need Help?</p>
            <ul className="text-white font-black space-y-2 text-lg">
              <li className="hover:text-[#C32025] cursor-pointer transition-colors">Contact Us</li>
              <li className="hover:text-[#C32025] cursor-pointer transition-colors">FAQs</li>
              <li className="hover:text-[#C32025] cursor-pointer transition-colors">Shipping Policy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SlurrpHome;
