// C++: templates, namespaces, lambdas, RAII, operator overloading.
//
// Exercises: namespaces, templates, type keywords, storage classes,
// preprocessor, lambdas, references, string literals, raw strings.

#include <cstdint>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

namespace adwaita {

constexpr std::uint8_t kMaxElevation = 7;

template <typename T, std::size_t N>
class Ring {
public:
	constexpr Ring() = default;

	constexpr std::size_t size() const noexcept { return count_; }

	constexpr void push(const T &value)
	{
		buffer_[head_] = value;
		head_ = (head_ + 1) % N;
		if (count_ < N) {
			++count_;
		}
	}

	const T &front() const noexcept { return buffer_[tail_]; }

private:
	T buffer_[N]{};
	std::size_t head_{0};
	std::size_t tail_{0};
	std::size_t count_{0};
};

struct Surface {
	std::string name;
	std::uint8_t elevation{0};

	bool is_recessed() const noexcept { return elevation < 2; }

	Surface &operator+=(std::uint8_t delta) noexcept
	{
		elevation = static_cast<std::uint8_t>(elevation + delta);
		return *this;
	}

	friend std::ostream &operator<<(std::ostream &stream, const Surface &surface)
	{
		return stream << surface.name << " (elevation " << +surface.elevation << ')';
	}
};

enum class Level : std::uint8_t { View, Window, Sidebar, Dialog };

} // namespace adwaita

int main()
{
	using namespace adwaita;

	Ring<Surface, 4> surfaces{};
	surfaces.push({"view", 0});
	surfaces.push({"sidebar", 2});

	const auto describe = [](const Surface &surface) -> std::string {
		return surface.is_recessed() ? "recessed" : "raised";
	};

	for (const auto &name : {"view", "sidebar", "dialog"}) {
		std::cout << name << ' ' << describe(surfaces.front()) << '\n';
	}

	Surface surface{"window", 1};
	surface += 3;
	std::cout << surface << '\n';

	const char *raw = R"(C:\path\to\adwaita)";
	std::cout << raw << " levels=" << static_cast<int>(Level::Sidebar) << '\n';

	auto pointer = std::make_unique<Surface>("dialog", 3);
	std::cout << *pointer << '\n';

	return 0;
}
