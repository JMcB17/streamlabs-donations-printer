const fs = require('fs')
const axios = require('axios')
const io = require('socket.io-client')
const ptp = require("pdf-to-printer")
const PDFDocument = require('pdfkit')
const probe = require('probe-image-size')
const sharp = require('sharp')

const download_image = (url, image_path) =>
    axios({
        url,
        responseType: 'stream',
    }).then(
        response =>
            new Promise((resolve, reject) => {
                response.data
                    .pipe(fs.createWriteStream(image_path))
                    .on('finish', () => resolve())
                    .on('error', e => reject(e));
            }),
    );

function printGrayscale(options, amount){
    if(options.printColor && parseFloat(amount) >= parseFloat(options.minColor)){
        return false
    }
    return true
}

function startListening(options) {
    let streamlabs = io(`https://sockets.streamlabs.com?token=${options.socketToken}`, { transports: ['websocket'] });

    streamlabs.on('event', (eventData) => {
        if (!eventData.for && eventData.type === 'donation') {
            //code to handle donation events
            let message = eventData.message[0]
            let id = message._id

            if (parseFloat(message.amount) >= parseFloat(options.minDonation)) {
                const imageRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)(?:jpg|png|JPG|PNG)/g

                let images = message.message.match(imageRegex)
                let image

                if (Array.isArray(images)) {
                    image = images[0]
                } else {
                    image = images
                }

                let text = message.message.replace(imageRegex, '').trim()

                let doc = new PDFDocument({ layout: 'landscape' })
                doc.pipe(fs.createWriteStream(`./pdfs/${id}.pdf`))

                doc.fontSize(24)
                doc.text(message.formattedAmount)
                if (image) {
                    // save image
                    // if b/w printing, process image
                    // probe image size
                    // put image in pdf
                    let image_file_name = id
                    if (image.match(/\.(jpg|JPG)$/) != null) {
                        image_file_name += ".jpg"
                    } else {
                        image_file_name += ".png"
                    }
                    let image_path = './images/' + image_file_name
                    let grayscalepath = "./images/bw" + image_file_name

                    download_image(image, image_path).then(value => {
                        if(printGrayscale(options, message.amount)){
                            return sharp(image_path).grayscale().toFile(grayscalepath)
                        }
                        return Promise.resolve()
                    }).then(result => {
                        probe(image).then(result => {
                            let widthPoints = result.width * .75
                            let heightPoints = result.height * .75
                            let imageOptions = false
                            let x = false
                            let y = false
                            if (widthPoints > 640 || heightPoints > 300) {
                                imageOptions = { fit: [640, 300], align: 'center', valign: 'center' }
                            } else {
                                x = (792 - widthPoints) / 2
                                y = (612 - heightPoints) / 2 - 20
                            }

                            let final_image_path = image_path

                            if (printGrayscale(options, message.amount)){
                                final_image_path = grayscalepath
                            }

                            if (imageOptions) {
                                doc.image(final_image_path, 76, 136, imageOptions)
                            } else {
                                doc.image(final_image_path, x, y)
                            }
                            return Promise.resolve()
                        }).then(value => {
                            doc.fontSize(24)
                            doc.text('- ' + message.from, 72, 510, { align: 'right' })
                            if (text.length > 0) {
                                doc.fontSize(19)
                                doc.text('"' + text + '"', 72, 460, { align: 'center' })
                            }

                            doc.end()

                            return Promise.resolve()
                        }).then(value => {
                            ptp.print(`./pdfs/${id}.pdf`, {
                                printer: options.printer
                            })
                        })
                    })
                } else {
                    doc.moveDown(3)
                    if (text.length > 0) {
                        let fontSize = 34
                        if (text.length <= 64) {
                            fontSize = 54
                        } else if (text.length <= 128) {
                            fontSize = 44
                        }
                        doc.fontSize(fontSize)
                        doc.text('"' + text + '"', { align: 'center', width: 648 })
                    }
                    doc.fontSize(24)
                    doc.text('- ' + message.from, 72, 510, { align: 'right' })
                    doc.end()

                    ptp.print(`./pdfs/${id}.pdf`, {
                        printer: options.printer
                    })
                }
            }
        }
    })

    return streamlabs
}

async function getPrinters() {
    return ptp.getPrinters()
}

export default {
    startListening,
    getPrinters
}