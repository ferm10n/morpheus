#include <string>

#define DEC 10
class SoftwareSerial {
  public:
  size_t printf(const char * format, ...)  __attribute__ ((format (printf, 2, 3))) {
    return 0;
  };
  // size_t print(const String &);
  // size_t print(const char[]);
  // size_t print(char);
  // size_t print(unsigned char, int = DEC);
  // size_t print(int, int = DEC);
  // size_t print(unsigned int, int = DEC);
  // size_t print(long, int = DEC);
  // size_t print(unsigned long, int = DEC);
  // size_t print(long long, int = DEC);
  // size_t print(unsigned long long, int = DEC);
  // size_t print(double, int = 2);
  // size_t print(const Printable&);

  // size_t println(const __FlashStringHelper *);
  // size_t println(const String &s);
  // size_t println(const char[]);
  // size_t println(char);
  // size_t println(unsigned char, int = DEC);
  size_t println(int, int = DEC) {
    return 0;
  };
  // size_t println(unsigned int, int = DEC);
  // size_t println(long, int = DEC);
  // size_t println(unsigned long, int = DEC);
  // size_t println(long long, int = DEC);
  // size_t println(unsigned long long, int = DEC);
  // size_t println(double, int = 2);
  // size_t println(const Printable&);
  // size_t println(void);
};

SoftwareSerial Serial;