import forno1 from "@/assets/forno-1.jpg";
import ambiente1 from "@/assets/ambiente-1.jpg";
import pizza1 from "@/assets/pizza-1.jpg";
import evento1 from "@/assets/evento-1.jpg";

interface FotosData {
  title: string;
  images: { src: string; alt: string }[];
}

const defaultData: FotosData = {
  title: "Fotos",
  images: [
    { src: forno1, alt: "Forno a lenha" },
    { src: ambiente1, alt: "Ambiente da pizzaria" },
    { src: pizza1, alt: "Pizza artesanal" },
    { src: evento1, alt: "Evento" },
  ],
};

const Fotos = ({ data = defaultData }: { data?: FotosData }) => {
  return (
    <section id="fotos" className="section-paper py-16 md:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">{data.title}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {data.images.map((img, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-40 md:h-52 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Fotos;
