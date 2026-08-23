const activities = [
  "Fitness",
  "Bodybuilding",
  "CrossFit",
  "Cardio",
  "Yoga",
  "Padel",
];

export default function ActivitiesSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <h2
          className="
          text-4xl
          font-bold
          text-center
          mb-12
        "
        >
          Our Activities
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity}
              className="
              bg-white
              p-8
              rounded-2xl
              shadow-md
              text-center
            "
            >
              <h3 className="text-xl font-semibold">
                {activity}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}