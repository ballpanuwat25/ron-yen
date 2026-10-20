import Book from '@/components/Book';
import FindUs from '@/components/FindUs';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Loader from '@/components/Loader';
import Plan from '@/components/Plan';
import SmoothScroll from '@/components/SmoothScroll';

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Loader />
      <Header />
      <main>
        <Hero />
        <Plan />
        <Book />
        <FindUs />
      </main>
      <Footer />
    </>
  );
}
